using System;
using MediatR;

namespace SmartHelpdesk.Application.Features.Tickets.Queries.SuggestTicketReply
{
    public class SuggestTicketReplyQuery : IRequest<string>
    {
        public Guid TicketId { get; set; }
        public Guid CurrentUserId { get; set; }
        public string CurrentUserName { get; set; } = string.Empty;
        public string CurrentUserRole { get; set; } = string.Empty;

        public SuggestTicketReplyQuery(Guid ticketId)
        {
            TicketId = ticketId;
        }
    }
}
