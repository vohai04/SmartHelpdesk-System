using System;
using MediatR;

namespace SmartHelpdesk.Application.Features.Tickets.Events
{
    public class TicketCreatedEvent : INotification
    {
        public Guid TicketId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;

        public TicketCreatedEvent(Guid ticketId, string title, string customerName, string customerEmail)
        {
            TicketId = ticketId;
            Title = title;
            CustomerName = customerName;
            CustomerEmail = customerEmail;
        }
    }
}
