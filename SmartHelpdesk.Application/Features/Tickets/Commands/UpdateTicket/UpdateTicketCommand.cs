using System;
using MediatR;

namespace SmartHelpdesk.Application.Features.Tickets.Commands.UpdateTicket
{
    public class UpdateTicketCommand : IRequest<bool>
    {
        public Guid TicketId { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public Guid? AssignedToId { get; set; }
        
        public Guid CurrentUserId { get; set; }
        public string CurrentUserRole { get; set; } = string.Empty;
    }
}
