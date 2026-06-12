using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Tickets.Events
{
    public class TicketCreatedEventHandler : INotificationHandler<TicketCreatedEvent>
    {
        private readonly IEmailService _emailService;

        public TicketCreatedEventHandler(IEmailService emailService)
        {
            _emailService = emailService;
        }

        public async Task Handle(TicketCreatedEvent notification, CancellationToken cancellationToken)
        {
            var subject = $"[Smart Helpdesk] Ticket Created: {notification.Title}";
            var body = $@"
                <h3>Hello {notification.CustomerName},</h3>
                <p>Your ticket <strong>'{notification.Title}'</strong> has been successfully created.</p>
                <p>We will review it and get back to you shortly.</p>
                <br/>
                <p>Best regards,<br/>Smart Helpdesk Support Team</p>
            ";

            await _emailService.SendEmailAsync(notification.CustomerEmail, subject, body);
        }
    }
}
