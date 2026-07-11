using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Enums;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Tickets.Commands.UpdateTicket
{
    public class UpdateTicketCommandHandler : IRequestHandler<UpdateTicketCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;

        public UpdateTicketCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(UpdateTicketCommand request, CancellationToken cancellationToken)
        {
            var ticket = await _unitOfWork.Repository<Ticket>().GetByIdAsync(request.TicketId);
            if (ticket == null)
            {
                throw new Exception($"Ticket with Id {request.TicketId} not found.");
            }

            // Only Admin and SupportAgent can update properties
            if (request.CurrentUserRole == UserRole.Customer.ToString())
            {
                throw new Exception("Customers are not allowed to update ticket properties directly.");
            }

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                if (Enum.TryParse<TicketStatus>(request.Status, true, out var status))
                {
                    ticket.Status = status;
                }
            }

            if (!string.IsNullOrWhiteSpace(request.Priority))
            {
                if (Enum.TryParse<TicketPriority>(request.Priority, true, out var priority))
                {
                    ticket.Priority = priority;
                }
            }

            // Null means unassign, a valid Guid means assign
            if (request.AssignedToId.HasValue)
            {
                if (request.AssignedToId.Value == Guid.Empty)
                {
                    ticket.AssignedToId = null;
                }
                else
                {
                    ticket.AssignedToId = request.AssignedToId.Value;
                }
            }

            ticket.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Ticket>().Update(ticket);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
