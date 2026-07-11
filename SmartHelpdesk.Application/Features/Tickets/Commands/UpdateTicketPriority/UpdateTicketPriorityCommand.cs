using System;
using MediatR;

namespace SmartHelpdesk.Application.Features.Tickets.Commands.UpdateTicketPriority
{
    public class UpdateTicketPriorityCommand : IRequest<bool>
    {
        public Guid TicketId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
