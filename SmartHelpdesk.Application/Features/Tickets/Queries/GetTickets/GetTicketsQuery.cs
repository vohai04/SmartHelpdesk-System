using MediatR;
using SmartHelpdesk.Application.Features.Tickets.DTOs;
using SmartHelpdesk.Domain.Common;

namespace SmartHelpdesk.Application.Features.Tickets.Queries.GetTickets
{
    public class GetTicketsQuery : IRequest<PagedList<TicketDto>>
    {
        public string? Keyword { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public System.Guid CurrentUserId { get; set; } = System.Guid.Empty;
        public string CurrentUserRole { get; set; } = string.Empty;
    }
}
