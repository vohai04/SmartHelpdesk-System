using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Application.Interfaces;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Tickets.Queries.AnalyzeTicketSentiment
{
    public class AnalyzeTicketSentimentQueryHandler : IRequestHandler<AnalyzeTicketSentimentQuery, string>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAiService _aiService;

        public AnalyzeTicketSentimentQueryHandler(IUnitOfWork unitOfWork, IAiService aiService)
        {
            _unitOfWork = unitOfWork;
            _aiService = aiService;
        }

        public async Task<string> Handle(AnalyzeTicketSentimentQuery request, CancellationToken cancellationToken)
        {
            var ticket = await _unitOfWork.Repository<Ticket>().GetByIdAsync(request.TicketId);
            if (ticket == null)
                throw new Exception($"Không tìm thấy Ticket với Id {request.TicketId}");

            var triage = await _aiService.AnalyzeTicketTriageAsync(ticket.Title, ticket.Description, cancellationToken);
            
            return triage.Sentiment;
        }
    }
}
