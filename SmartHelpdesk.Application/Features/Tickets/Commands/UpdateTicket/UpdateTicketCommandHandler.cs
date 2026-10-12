using MediatR;
using Microsoft.EntityFrameworkCore;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Enums;
using SmartHelpdesk.Domain.Exceptions;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Tickets.Commands.UpdateTicket;

public class UpdateTicketCommandHandler(IUnitOfWork db, SmartHelpdesk.Application.Interfaces.ITicketWorkflowSettings settings) : IRequestHandler<UpdateTicketCommand, bool>
{
    public async Task<bool> Handle(UpdateTicketCommand request, CancellationToken token)
    {
        await using var transaction = await db.BeginTransactionAsync(token);
        var ticket = await db.Repository<Ticket>().GetByIdAsync(request.TicketId);
        if (ticket is null || ticket.IsDeleted) throw new NotFoundException("Ticket unavailable.");
        await db.LockUsersAsync(new[] { request.CurrentUserId, request.AssignedToId ?? Guid.Empty, ticket.TransferTargetId ?? Guid.Empty }, token);
        var actor = await db.Repository<User>().GetByIdAsync(request.CurrentUserId);
        if (actor is null || !actor.IsActive || actor.IsDeleted) throw new UnauthorizedAccessException("Account unavailable.");
        var admin = actor.Role == UserRole.Admin;
        var customer = actor.Role == UserRole.Customer;
        var action = request.Action ?? (request.AssignedToId.HasValue ? "Assign" : "Update");
        if (customer && (ticket.CreatedById != actor.Id || action is not ("ConfirmResolution" or "Reopen" or "Withdraw")))
            throw new UnauthorizedAccessException("You cannot perform this action.");
        if (request.ExpectedVersion.HasValue && ticket.Version != request.ExpectedVersion)
            throw new ConflictException("The ticket changed. Refresh and try again.");
        if ((request.Action is not null || request.AssignedToId.HasValue) && !request.ExpectedVersion.HasValue) throw new BadRequestException("ExpectedVersion is required.");
        var previous = $"Status={ticket.Status}; Assignee={ticket.AssignedToId}; Priority={ticket.Priority}; TransferTarget={ticket.TransferTargetId}; TransferReason={ticket.TransferReason}";
        var previousAssignee = ticket.AssignedToId;
        var previousTarget = ticket.TransferTargetId;
        var changed = true;
        string Reason()
        {
            var reason = request.Reason?.Trim();
            if (string.IsNullOrWhiteSpace(reason) || reason.Length < 3 || reason.Length > 2000)
                throw new BadRequestException("Provide a reason of 3-2000 characters.");
            return reason;
        }
        void Owner()
        {
            if (!admin && ticket.AssignedToId != actor.Id) throw new UnauthorizedAccessException("Only the responsible agent or Admin can change this ticket.");
        }
        void ClearTransfer() { ticket.TransferRequestedById = null; ticket.TransferTargetId = null; ticket.TransferReason = null; ticket.TransferRequestedAt = null; }
        async Task<User> Agent(Guid? id)
        {
            var agent = id.HasValue ? await db.Repository<User>().GetByIdAsync(id.Value) : null;
            if (agent is null || agent.IsDeleted || !agent.IsActive || agent.Role != UserRole.Agent)
                throw new BadRequestException("Choose an active support agent.");
            return agent;
        }
        void PublicMessage(string text)
        {
            pendingMessages.Add(new TicketMessage { TicketId = ticket.Id, SenderId = actor.Id, Content = text });
        }
        switch (action)
        {
            case "Assign":
            case "Claim":
                if (ticket.Status is TicketStatus.Closed or TicketStatus.Resolved) throw new BadRequestException("Reopen the ticket before assigning it.");
                if (action == "Claim") request.AssignedToId = actor.Id;
                if (request.AssignedToId == Guid.Empty) {
                    Owner();
                    if (ticket.Status != TicketStatus.Open || ticket.StartedAt.HasValue) throw new BadRequestException("Request a handover for work already started.");
                    Reason(); ticket.AssignedToId = null; ClearTransfer(); break;
                }
                var assignee = await Agent(request.AssignedToId);
                if (!admin && (assignee.Id != actor.Id || (ticket.AssignedToId.HasValue && ticket.AssignedToId != actor.Id)))
                    throw new UnauthorizedAccessException("Agents can only claim unassigned tickets.");
                if (ticket.AssignedToId == assignee.Id) { changed = false; break; }
                if (ticket.AssignedToId.HasValue) Reason();
                ticket.AssignedToId = assignee.Id; ClearTransfer(); break;
            case "ReturnToQueue":
                Owner(); Reason();
                if (ticket.Status != TicketStatus.Open || ticket.StartedAt.HasValue) throw new BadRequestException("Only work not yet started can return to the queue.");
                ticket.AssignedToId = null; ClearTransfer(); break;
            case "RequestTransfer":
                Owner();
                if (!ticket.AssignedToId.HasValue || ticket.Status is TicketStatus.Closed or TicketStatus.Resolved)
                    throw new BadRequestException("Only an active assigned ticket can be handed over.");
                if (ticket.TransferRequestedAt.HasValue) throw new ConflictException("A handover is already pending.");
                if (request.AssignedToId.HasValue && request.AssignedToId != Guid.Empty) {
                    var target = await Agent(request.AssignedToId);
                    if (target.Id == ticket.AssignedToId) throw new BadRequestException("Choose a different agent.");
                    ticket.TransferTargetId = target.Id;
                }
                ticket.TransferReason = Reason(); ticket.TransferRequestedById = actor.Id; ticket.TransferRequestedAt = DateTime.UtcNow;
                await db.Repository<TicketJob>().AddAsync(new TicketJob { TicketId = ticket.Id, Kind = TicketJobKind.TransferReminder, NextAttemptAt = DateTime.UtcNow.Add(settings.TransferReminderDelay), MessageId = ticket.TransferRequestedAt.Value.ToString("O") });
                break;
            case "AcceptTransfer":
                if (!ticket.TransferRequestedAt.HasValue) throw new ConflictException("There is no pending handover.");
                if (!admin && ticket.TransferTargetId != actor.Id) throw new UnauthorizedAccessException("Only the requested agent can accept.");
                var receiver = await Agent(admin ? request.AssignedToId ?? ticket.TransferTargetId : actor.Id);
                ticket.AssignedToId = receiver.Id; ClearTransfer(); break;
            case "RejectTransfer":
                if (!ticket.TransferRequestedAt.HasValue) throw new ConflictException("There is no pending handover.");
                if (!admin && ticket.TransferTargetId != actor.Id) throw new UnauthorizedAccessException("Only the requested agent can reject.");
                Reason(); ClearTransfer(); break;
            case "CancelTransfer":
                if (!ticket.TransferRequestedAt.HasValue) throw new ConflictException("There is no pending handover.");
                if (!admin && ticket.TransferRequestedById != actor.Id) throw new UnauthorizedAccessException("Only the requester can cancel.");
                Reason(); ClearTransfer(); break;
            case "Start":
                Owner();
                if (ticket.Status != TicketStatus.Open || !ticket.AssignedToId.HasValue) throw new BadRequestException("Assign an Open ticket before starting work.");
                ticket.Status = TicketStatus.InProgress; ticket.StartedAt ??= DateTime.UtcNow; break;
            case "WaitForCustomer":
                Owner();
                if (ticket.Status != TicketStatus.InProgress) throw new BadRequestException("Only work in progress can wait for the customer.");
                PublicMessage(Reason()); ticket.Status = TicketStatus.WaitingForCustomer; break;
            case "Resolve":
                Owner();
                if (!ticket.AssignedToId.HasValue || ticket.Status is not (TicketStatus.InProgress or TicketStatus.WaitingForCustomer)) throw new BadRequestException("Start work before resolving the ticket.");
                ticket.ResolvedAt = DateTime.UtcNow; ticket.Resolution = Reason(); PublicMessage(ticket.Resolution); ticket.Status = TicketStatus.Resolved; ClearTransfer(); break;
            case "ConfirmResolution":
                if (!customer && !admin) throw new UnauthorizedAccessException("Only the requester or Admin can confirm resolution.");
                if (ticket.Status != TicketStatus.Resolved) throw new BadRequestException("Only a resolved ticket can be confirmed.");
                ticket.Status = TicketStatus.Closed; ticket.ClosureReason = "Confirmed resolution"; ClearTransfer(); break;
            case "Close":
                if (!admin) throw new UnauthorizedAccessException("Only Admin can close without customer confirmation.");
                if (ticket.Status == TicketStatus.Closed) { changed = false; break; }
                ticket.ClosureReason = Reason(); ticket.Status = TicketStatus.Closed; ClearTransfer(); break;
            case "Withdraw":
                if (!customer && !admin) throw new UnauthorizedAccessException("Only the requester or Admin can withdraw.");
                if (ticket.Status == TicketStatus.Closed) throw new BadRequestException("The ticket is already closed.");
                ticket.Resolution = null; ticket.ResolvedAt = null; ticket.ClosureReason = "Withdrawn: " + Reason(); ticket.Status = TicketStatus.Closed; ClearTransfer(); break;
            case "Reopen":
                if (!customer) Owner();
                if (ticket.Status is not (TicketStatus.Resolved or TicketStatus.Closed)) throw new BadRequestException("Only resolved or closed tickets can reopen.");
                PublicMessage(Reason());
                var existing = ticket.AssignedToId.HasValue ? await db.Repository<User>().GetByIdAsync(ticket.AssignedToId.Value) : null;
                if (existing is null || !existing.IsActive || existing.IsDeleted || existing.Role != UserRole.Agent) ticket.AssignedToId = null;
                ticket.Status = ticket.AssignedToId.HasValue ? TicketStatus.InProgress : TicketStatus.Open;
                ticket.Resolution = null; ticket.ResolvedAt = null; ticket.ClosureReason = null; ClearTransfer(); break;
            case "Update":
                Owner();
                if (!string.IsNullOrWhiteSpace(request.Status)) throw new BadRequestException("Use the dedicated lifecycle action instead of editing status.");
                if (ticket.Status is TicketStatus.Closed or TicketStatus.Resolved) throw new BadRequestException("Reopen the ticket before editing priority.");
                if (!Enum.TryParse<TicketPriority>(request.Priority, true, out var priority) || !Enum.GetNames<TicketPriority>().Contains(request.Priority, StringComparer.OrdinalIgnoreCase))
                    throw new BadRequestException("Invalid ticket priority.");
                if (ticket.Priority == priority && ticket.PrioritySource == PrioritySource.Manual) { changed = false; break; }
                ticket.Priority = priority; ticket.PrioritySource = PrioritySource.Manual; break;
            default: throw new BadRequestException("Unknown ticket action.");
        }
        if (!changed) return true;
        foreach (var message in pendingMessages) {
            await db.Repository<TicketMessage>().AddAsync(message);
            await db.Repository<TicketJob>().AddAsync(new TicketJob { TicketId = ticket.Id, Kind = TicketJobKind.Notification, MessageId = message.Id.ToString(), Title = "New message", Message = "A new message is available on the ticket." });
            await db.Repository<TicketJob>().AddAsync(new TicketJob { TicketId = ticket.Id, Kind = TicketJobKind.Notification, RecipientId = ticket.CreatedById, MessageId = message.Id.ToString(), Title = "New message", Message = "A new message is available on the ticket." });
        }
        ticket.Version++; ticket.UpdatedAt = DateTime.UtcNow;
        await db.Repository<AuditLog>().AddAsync(new AuditLog { UserId = actor.Id, EntityName = "Ticket", EntityId = ticket.Id, Action = action, OldValues = previous, NewValues = $"Status={ticket.Status}; Assignee={ticket.AssignedToId}; Priority={ticket.Priority}; TransferTarget={ticket.TransferTargetId}; Reason={request.Reason}" });
        await db.Repository<TicketJob>().AddAsync(new TicketJob { TicketId = ticket.Id, Kind = TicketJobKind.Realtime });
        await db.Repository<TicketJob>().AddAsync(new TicketJob { TicketId = ticket.Id, Kind = TicketJobKind.Notification, RecipientId = ticket.CreatedById, Title = "Ticket updated", Message = "The ticket details have changed." });
        async Task Notify(Guid? recipient, string title, string message)
        {
            if (recipient.HasValue && recipient != actor.Id)
                await db.Repository<TicketJob>().AddAsync(new TicketJob { TicketId = ticket.Id, Kind = TicketJobKind.Notification, RecipientId = recipient, Title = title, Message = message });
        }
        if (previousAssignee != ticket.AssignedToId)
        {
            await Notify(ticket.AssignedToId, "Ticket assigned to you", $"{actor.FullName} assigned you: {ticket.Title}");
            await Notify(previousAssignee, "Ticket reassigned", $"You are no longer responsible for: {ticket.Title}");
        }
        if (action == "RequestTransfer" && ticket.TransferTargetId.HasValue)
            await Notify(ticket.TransferTargetId, "Handover requested", $"{actor.FullName} requested that you take over: {ticket.Title}");
        else if (action is "RejectTransfer" or "CancelTransfer")
        {
            await Notify(previousAssignee, "Handover " + (action == "RejectTransfer" ? "declined" : "cancelled"), ticket.Title);
            if (previousTarget != previousAssignee) await Notify(previousTarget, "Handover cancelled", ticket.Title);
        }
        else if (previousAssignee == ticket.AssignedToId && action != "RequestTransfer")
            await Notify(ticket.AssignedToId, "Ticket updated", ticket.Title);
        if (action == "RequestTransfer" && !ticket.TransferTargetId.HasValue)
        {
            var admins = await db.Repository<User>().FindAsync(u => u.IsActive && u.Role == UserRole.Admin);
            foreach (var coordinator in admins) await Notify(coordinator.Id, "Handover needs an agent", ticket.Title);
        }
        await db.SaveChangesAsync(token);
        await transaction.CommitAsync(token);
        return true;
    }
    // Scoped handler: message additions share the ticket action's transaction.
    private readonly List<TicketMessage> pendingMessages = [];
}
