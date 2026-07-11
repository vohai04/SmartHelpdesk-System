using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Enums;
using SmartHelpdesk.Domain.Interfaces;
using SmartHelpdesk.Application.Interfaces;

namespace SmartHelpdesk.Application.Features.Tickets.Commands.UpdateTicket
{
    public class UpdateTicketCommandHandler : IRequestHandler<UpdateTicketCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notificationService;

        public UpdateTicketCommandHandler(IUnitOfWork unitOfWork, INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
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

            if (request.CurrentUserRole == UserRole.Agent.ToString())
            {
                if (request.AssignedToId.HasValue && request.AssignedToId.Value != Guid.Empty && request.AssignedToId.Value != request.CurrentUserId)
                {
                    throw new Exception("Agents can only assign tickets to themselves.");
                }
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

            bool isNewAssignee = false;
            Guid? newAssigneeId = null;

            // Null means unassign, a valid Guid means assign
            if (request.AssignedToId.HasValue)
            {
                if (request.AssignedToId.Value == Guid.Empty)
                {
                    ticket.AssignedToId = null;
                }
                else
                {
                    if (ticket.AssignedToId != request.AssignedToId.Value)
                    {
                        isNewAssignee = true;
                        newAssigneeId = request.AssignedToId.Value;
                    }
                    ticket.AssignedToId = request.AssignedToId.Value;
                }
            }

            ticket.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Ticket>().Update(ticket);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Send real-time notification so UI updates immediately (e.g. status changes to Closed)
            await _notificationService.SendToUserAsync(ticket.CreatedById, "Ticket cập nhật", $"Ticket #{ticket.Id.ToString().Split('-')[0].ToUpper()} đã được cập nhật trạng thái/ưu tiên.", ticket.Id.ToString());
            
            if (isNewAssignee && newAssigneeId.HasValue)
            {
                await _notificationService.SendToUserAsync(newAssigneeId.Value, "Gán Ticket Mới", $"Bạn vừa được phân công xử lý Ticket #{ticket.Id.ToString().Split('-')[0].ToUpper()}", ticket.Id.ToString());
            }
            else
            {
                await _notificationService.SendToAllAgentsAsync("Ticket cập nhật", $"Ticket #{ticket.Id.ToString().Split('-')[0].ToUpper()} đã được cập nhật.", ticket.Id.ToString());
            }

            return true;
        }
    }
}
