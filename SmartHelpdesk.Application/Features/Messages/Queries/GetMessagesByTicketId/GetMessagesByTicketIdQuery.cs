using System;
using MediatR;
using SmartHelpdesk.Application.Features.Messages.DTOs;
using SmartHelpdesk.Domain.Common;

namespace SmartHelpdesk.Application.Features.Messages.Queries.GetMessagesByTicketId
{
    public class GetMessagesByTicketIdQuery : IRequest<PagedList<TicketMessageDto>>
    {
        public Guid TicketId { get; set; }
        public string UserRole { get; set; }
        public Guid CurrentUserId { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }
}
