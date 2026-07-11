using System;
using MediatR;
using SmartHelpdesk.Application.Features.Messages.DTOs;

namespace SmartHelpdesk.Application.Features.Messages.Commands.AddMessage
{
    public class AddMessageCommand : IRequest<TicketMessageDto>
    {
        public Guid TicketId { get; set; }
        public Guid SenderId { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsInternalNote { get; set; }
        public System.Collections.Generic.List<Guid>? AttachmentIds { get; set; }
    }
}
