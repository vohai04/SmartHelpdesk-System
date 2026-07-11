using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Enums;
using SmartHelpdesk.Domain.Interfaces;
using SmartHelpdesk.Application.Interfaces;

namespace SmartHelpdesk.Application.Features.Tickets.Commands.AnalyzeTicketTriage
{
    public class AnalyzeTicketTriageCommandHandler : IRequestHandler<AnalyzeTicketTriageCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAiService _aiService;
        private readonly INotificationService _notificationService;

        public AnalyzeTicketTriageCommandHandler(
            IUnitOfWork unitOfWork,
            IAiService aiService,
            INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _aiService = aiService;
            _notificationService = notificationService;
        }

        public async Task<bool> Handle(AnalyzeTicketTriageCommand request, CancellationToken cancellationToken)
        {
            // 1. Analyze with AI
            var triageResult = await _aiService.AnalyzeTicketTriageAsync(request.Title, request.Description, cancellationToken);
            
            if (!Enum.TryParse<SmartHelpdesk.Domain.Enums.TicketPriority>(triageResult.Priority, true, out var priority))
            {
                priority = SmartHelpdesk.Domain.Enums.TicketPriority.Medium; // Default fallback
            }

            // 2. Fetch ticket and update DB
            var ticketRepository = _unitOfWork.Repository<Ticket>();
            var ticket = await ticketRepository.GetByIdAsync(request.TicketId);

            if (ticket == null) return false;

            ticket.Priority = priority;
            ticket.AiSentiment = triageResult.Sentiment;
            ticket.AiSummary = triageResult.Summary;
            ticket.IsAiTriaged = true;

            ticketRepository.Update(ticket);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 3. Notify Frontend via SignalR to trigger live reload
            await _notificationService.SendToAllAgentsAsync(
                "AI Triage Completed", 
                $"Ticket #{ticket.Id.ToString().Split('-')[0].ToUpper()} được AI phân loại mức độ {priority}.",
                ticket.Id.ToString()
            );

            return true;
        }
    }
}
