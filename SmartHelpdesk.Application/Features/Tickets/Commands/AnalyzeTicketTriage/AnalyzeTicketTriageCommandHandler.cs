using MediatR;
using SmartHelpdesk.Application.Interfaces;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Enums;
using SmartHelpdesk.Domain.Interfaces;
namespace SmartHelpdesk.Application.Features.Tickets.Commands.AnalyzeTicketTriage;
public class AnalyzeTicketTriageCommandHandler(IUnitOfWork unitOfWork, IAiService aiService)
    : IRequestHandler<AnalyzeTicketTriageCommand, bool>
{
    public async Task<bool> Handle(AnalyzeTicketTriageCommand request, CancellationToken cancellationToken)
    {
        var repository = unitOfWork.Repository<Ticket>();
        var ticket = await repository.GetByIdAsync(request.TicketId);
        if (ticket is null || ticket.TriageStatus == TriageStatus.Completed) return false;
        var result = await aiService.AnalyzeTicketTriageAsync(ticket.Title, ticket.Description, cancellationToken);
        if (!Enum.TryParse<TicketPriority>(result.Priority, true, out var priority) || !Enum.IsDefined(priority) || !Enum.GetNames<TicketPriority>().Contains(result.Priority, StringComparer.OrdinalIgnoreCase)
            || string.IsNullOrWhiteSpace(result.Summary) || string.IsNullOrWhiteSpace(result.Sentiment))
            throw new InvalidOperationException("AI returned an invalid triage result.");
        // Version is an EF concurrency token. A simultaneous human edit causes a retry,
        // which reloads the ticket and preserves PrioritySource.Manual.
        if (ticket.PrioritySource != PrioritySource.Manual) { ticket.Priority = priority; ticket.PrioritySource = PrioritySource.Ai; }
        ticket.AiSentiment = result.Sentiment; ticket.AiSummary = result.Summary;
        ticket.IsAiTriaged = true; ticket.TriageStatus = TriageStatus.Completed; ticket.Version++;
        repository.Update(ticket);
        await unitOfWork.Repository<AuditLog>().AddAsync(new AuditLog
        {
            Action = "AiTriage",
            EntityName = "Ticket",
            EntityId = ticket.Id,
            NewValues = $"Priority: {ticket.Priority}, Source: {ticket.PrioritySource}"
        });
        await unitOfWork.Repository<TicketJob>().AddAsync(new TicketJob { TicketId = ticket.Id, Kind = TicketJobKind.Realtime });
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
