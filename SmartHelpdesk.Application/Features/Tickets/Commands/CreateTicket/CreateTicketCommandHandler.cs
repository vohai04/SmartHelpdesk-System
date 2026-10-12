using MediatR;
using SmartHelpdesk.Application.Interfaces;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Enums;
using SmartHelpdesk.Domain.Interfaces;
namespace SmartHelpdesk.Application.Features.Tickets.Commands.CreateTicket;
public class CreateTicketCommandHandler(IUnitOfWork unitOfWork) : IRequestHandler<CreateTicketCommand, Guid>
{
    public async Task<Guid> Handle(CreateTicketCommand request, CancellationToken cancellationToken)
    {
        var category = await unitOfWork.Repository<Category>().GetByIdAsync(request.CategoryId);
        var requester = await unitOfWork.Repository<User>().GetByIdAsync(request.CreatedById);
        if (category is null || category.IsDeleted) throw new SmartHelpdesk.Domain.Exceptions.BadRequestException("The category is unavailable.");
        if (requester is null || !requester.IsActive || requester.IsDeleted) throw new SmartHelpdesk.Domain.Exceptions.BadRequestException("The requester is unavailable.");
        var ticket = new Ticket
        {
            Title = request.Title,
            Description = request.Description,
            CategoryId = request.CategoryId,
            CreatedById = request.CreatedById,
            Priority = null,
            PrioritySource = PrioritySource.Pending,
            TriageStatus = TriageStatus.Pending
        };
        await unitOfWork.Repository<Ticket>().AddAsync(ticket);
        foreach (var kind in new[] { TicketJobKind.Triage, TicketJobKind.Email, TicketJobKind.Realtime, TicketJobKind.CreatedNotification })
            await unitOfWork.Repository<TicketJob>().AddAsync(new TicketJob { TicketId = ticket.Id, Kind = kind });
        // EF commits the ticket and its durable jobs in one transaction.
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return ticket.Id;
    }
}
