using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Application.Interfaces;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Tickets.Queries.SuggestTicketReply
{
    public class SuggestTicketReplyQueryHandler : IRequestHandler<SuggestTicketReplyQuery, string>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAiService _aiService;

        public SuggestTicketReplyQueryHandler(IUnitOfWork unitOfWork, IAiService aiService)
        {
            _unitOfWork = unitOfWork;
            _aiService = aiService;
        }

        public async Task<string> Handle(SuggestTicketReplyQuery request, CancellationToken cancellationToken)
        {
            var ticket = await _unitOfWork.Repository<Ticket>().GetByIdAsync(request.TicketId);
            if (ticket == null)
                throw new Exception($"Không tìm thấy Ticket với Id {request.TicketId}");

            var contentToAnalyze = $"Title: {ticket.Title}\nDescription: {ticket.Description}";

            return await _aiService.SuggestReplyAsync(contentToAnalyze, cancellationToken);
        }
    }
}
