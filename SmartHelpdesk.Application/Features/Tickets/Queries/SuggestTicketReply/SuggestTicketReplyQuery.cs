using System;
using MediatR;

namespace SmartHelpdesk.Application.Features.Tickets.Queries.SuggestTicketReply
{
    public class SuggestTicketReplyQuery : IRequest<string>
    {
        public Guid TicketId { get; set; }

        public SuggestTicketReplyQuery(Guid ticketId)
        {
            TicketId = ticketId;
        }
    }
}
