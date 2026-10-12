using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SmartHelpdesk.Application.Features.Tickets.Commands.AnalyzeTicketTriage;
using SmartHelpdesk.Application.Features.Tickets.Events;
using SmartHelpdesk.Application.Interfaces;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Enums;
using SmartHelpdesk.Infrastructure.Persistence;
namespace SmartHelpdesk.Infrastructure.Services;

// Jobs use a PostgreSQL lease rather than process-local delegates. Independent lanes
// prevent slow SMTP from blocking triage or delivery of realtime updates.
public class DurableTicketWorker(IServiceScopeFactory scopes, IConfiguration configuration,
    ILogger<DurableTicketWorker> logger) : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken token)
    {
        if (!configuration.GetValue("TicketJobs:Enabled", true)) return Task.CompletedTask;
        var concurrency = Math.Clamp(configuration.GetValue("TicketJobs:AiConcurrency", 2), 1, 8);
        var lanes = Enumerable.Range(0, concurrency).Select(_ => RunLane(TicketJobKind.Triage, token)).ToList();
        lanes.Add(RunLane(TicketJobKind.Email, token));
        lanes.Add(RunLane(TicketJobKind.Realtime, token));
        lanes.Add(RunLane(TicketJobKind.CreatedNotification, token));
        lanes.Add(RunLane(TicketJobKind.Notification, token));
        lanes.Add(RunLane(TicketJobKind.TransferReminder, token));
        return Task.WhenAll(lanes);
    }
    private async Task RunLane(TicketJobKind kind, CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopes.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var now = DateTime.UtcNow;
                var lease = Guid.NewGuid();
                var expires = now.AddMinutes(2);
                // Atomic claim is safe with several workers/processes and reclaims expired leases.
                var jobs = await db.TicketJobs.FromSqlInterpolated($"""
                    UPDATE "TicketJobs" SET "Status"=1, "Attempts"="Attempts"+1,
                        "NextAttemptAt"={expires}, "LeaseId"={lease}
                    WHERE "Id"=(SELECT "Id" FROM "TicketJobs"
                        WHERE "Kind"={(int)kind} AND "Status" IN (0,1) AND "NextAttemptAt"<={now}
                        ORDER BY "NextAttemptAt", "CreatedAt" LIMIT 1 FOR UPDATE SKIP LOCKED)
                    RETURNING *
                    """).AsNoTracking().ToListAsync(stoppingToken);
                var job = jobs.SingleOrDefault();
                if (job is null) { await Task.Delay(Math.Clamp(configuration.GetValue("TicketJobs:PollIntervalMilliseconds", 500), 100, 5000), stoppingToken); continue; }
                using var timeout = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                timeout.CancelAfter(TimeSpan.FromSeconds(Math.Clamp(configuration.GetValue("TicketJobs:TimeoutSeconds", 30), 1, 60)));
                try
                {
                    if (job.Attempts > 3) throw new InvalidOperationException("Job retry limit reached after lease recovery.");
                    await Process(scope.ServiceProvider, db, job, timeout.Token);
                    await db.TicketJobs.Where(j => j.Id == job.Id && j.LeaseId == lease)
                        .ExecuteUpdateAsync(s => s.SetProperty(j => j.Status, TicketJobStatus.Completed)
                            .SetProperty(j => j.LastError, (string?)null), stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
                catch (Exception error)
                {
                    logger.LogWarning(error, "Ticket job {Id} ({Kind}) attempt {Attempt} failed", job.Id, kind, job.Attempts);
                    // Use a fresh context: failed optimistic writes must not be accidentally committed.
                    using var failureScope = scopes.CreateScope();
                    var failedDb = failureScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var owned = await failedDb.TicketJobs.SingleOrDefaultAsync(j => j.Id == job.Id && j.LeaseId == lease, stoppingToken);
                    if (owned is null) continue;
                    owned.Status = job.Attempts >= 3 ? TicketJobStatus.Failed : TicketJobStatus.Queued;
                    owned.NextAttemptAt = DateTime.UtcNow.AddSeconds(Math.Pow(2, Math.Min(job.Attempts, 3)));
                    owned.LastError = error is OperationCanceledException ? "Processing timed out." : "Processing failed. See server logs.";
                    if (kind == TicketJobKind.Triage)
                    {
                        var ticket = await failedDb.Tickets.SingleOrDefaultAsync(t => t.Id == job.TicketId, stoppingToken);
                        if (ticket is not null && ticket.TriageStatus != TriageStatus.Completed)
                        {
                            ticket.TriageStatus = owned.Status == TicketJobStatus.Failed ? TriageStatus.Failed : TriageStatus.Pending;
                            ticket.Version++;
                            failedDb.TicketJobs.Add(new TicketJob { TicketId = ticket.Id, Kind = TicketJobKind.Realtime });
                        }
                    }
                    await failedDb.SaveChangesAsync(stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception error)
            {
                logger.LogError(error, "Ticket worker {Kind} could not claim or finish a job", kind);
                try { await Task.Delay(1000, stoppingToken); } catch (OperationCanceledException) { break; }
            }
        }
    }
    private static async Task Process(IServiceProvider services, ApplicationDbContext db, TicketJob job, CancellationToken token)
    {
        var ticket = await db.Tickets.SingleOrDefaultAsync(t => t.Id == job.TicketId, token);
        if (ticket is null) return;
        if (job.Kind == TicketJobKind.Triage)
        {
            if (ticket.TriageStatus == TriageStatus.Completed) return;
            ticket.TriageStatus = TriageStatus.Processing; ticket.Version++;
            db.TicketJobs.Add(new TicketJob { TicketId = ticket.Id, Kind = TicketJobKind.Realtime });
            await db.SaveChangesAsync(token);
            await services.GetRequiredService<IMediator>().Send(new AnalyzeTicketTriageCommand { TicketId = ticket.Id }, token);
        }
        else if (job.Kind == TicketJobKind.Email)
        {
            var customer = await db.Users.SingleOrDefaultAsync(u => u.Id == ticket.CreatedById, token);
            if (customer is not null)
                await services.GetRequiredService<IMediator>().Publish(new TicketCreatedEvent(ticket.Id, ticket.Title, customer.FullName, customer.Email), token).WaitAsync(token);
        }
        else if (job.Kind == TicketJobKind.CreatedNotification)
        {
            await services.GetRequiredService<INotificationService>().SendToAllAgentsAsync("New ticket", "A new support request has been created.", ticket.Id.ToString(), eventId: job.Id).WaitAsync(token);
        }
        else if (job.Kind == TicketJobKind.Notification)
        {
            var notifications = services.GetRequiredService<INotificationService>();
            if (job.RecipientId.HasValue) await notifications.SendToUserAsync(job.RecipientId.Value, job.Title ?? "Ticket updated", job.Message ?? "Ticket updated", ticket.Id.ToString(), job.MessageId, job.Id).WaitAsync(token);
            else await notifications.SendToAllAgentsAsync(job.Title ?? "Ticket updated", job.Message ?? "Ticket updated", ticket.Id.ToString(), job.MessageId, job.Id).WaitAsync(token);
        }
        else if (job.Kind == TicketJobKind.TransferReminder)
        {
            if (ticket.TransferRequestedAt?.ToString("O") != job.MessageId) return;
            var admins = await db.Users.Where(u => u.Role == UserRole.Admin && u.IsActive).Select(u => u.Id).ToListAsync(token);
            foreach (var adminId in admins)
                await services.GetRequiredService<INotificationService>().SendToUserAsync(adminId, "Handover needs attention", "A ticket handover is overdue. The current owner remains responsible.", ticket.Id.ToString(), eventId: job.Id).WaitAsync(token);
        }
        else
        {
            var assignee = ticket.AssignedToId.HasValue ? await db.Users.SingleOrDefaultAsync(u => u.Id == ticket.AssignedToId, token) : null;
            await services.GetRequiredService<INotificationService>().SendTicketUpdateAsync(ticket.CreatedById,
                new TicketRealtimeUpdate(ticket.Id, ticket.Status.ToString(), ticket.Priority?.ToString(),
                    ticket.TriageStatus.ToString(), ticket.PrioritySource.ToString(), ticket.Version, ticket.AssignedToId, assignee?.FullName, ticket.TransferRequestedAt.HasValue)).WaitAsync(token);
        }
    }
}
