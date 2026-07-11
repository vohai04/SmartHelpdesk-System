using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Enums;
using SmartHelpdesk.Domain.Interfaces;
using SmartHelpdesk.Application.Interfaces;

namespace SmartHelpdesk.Application.Features.Tickets.Commands.UpdateTicketPriority
{
    public class UpdateTicketPriorityCommandHandler : IRequestHandler<UpdateTicketPriorityCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAiService _aiService;
        private readonly INotificationService _notificationService;

        public UpdateTicketPriorityCommandHandler(
            IUnitOfWork unitOfWork,
            IAiService aiService,
            INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _aiService = aiService;
            _notificationService = notificationService;
        }

        public async Task<bool> Handle(UpdateTicketPriorityCommand request, CancellationToken cancellationToken)
        {
            // 1. Analyze with AI
            var priorityStr = await _aiService.DeterminePriorityAsync(request.Title, request.Description, cancellationToken);
            
            if (!Enum.TryParse<SmartHelpdesk.Domain.Enums.TicketPriority>(priorityStr, true, out var priority))
            {
                priority = SmartHelpdesk.Domain.Enums.TicketPriority.Medium; // Default fallback
            }

            // 2. Fetch ticket and update DB
            var ticketRepository = _unitOfWork.Repository<Ticket>();
            var ticket = await ticketRepository.GetByIdAsync(request.TicketId);

            if (ticket == null) return false;

            ticket.Priority = priority;
            ticket.IsAiTriaged = true;

            ticketRepository.Update(ticket);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 3. Notify Frontend via SignalR to trigger live reload
            await _notificationService.SendToAllAgentsAsync(
                "Ticket Updated", 
                $"Ticket {ticket.Id} priority updated by AI to {priority}"
            );

            return true;
        }
    }
}
