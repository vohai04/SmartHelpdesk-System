using System;
using MediatR;

namespace SmartHelpdesk.Application.Features.Tickets.Queries.AnalyzeTicketSentiment
{
    public class AnalyzeTicketSentimentQuery : IRequest<string>
    {
        public Guid TicketId { get; set; }
        
        public AnalyzeTicketSentimentQuery(Guid ticketId)
        {
            TicketId = ticketId;
        }
    }
}
