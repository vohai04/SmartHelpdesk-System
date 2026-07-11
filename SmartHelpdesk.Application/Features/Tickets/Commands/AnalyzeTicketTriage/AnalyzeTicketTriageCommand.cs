using System;
using MediatR;

namespace SmartHelpdesk.Application.Features.Tickets.Commands.AnalyzeTicketTriage
{
    public class AnalyzeTicketTriageCommand : IRequest<bool>
    {
        public Guid TicketId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
