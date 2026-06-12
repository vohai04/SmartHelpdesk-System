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
    }
}
