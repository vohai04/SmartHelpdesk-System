using System;

namespace SmartHelpdesk.Application.Features.Messages.DTOs
{
    public class TicketMessageDto
    {
        public Guid Id { get; set; }
        public Guid TicketId { get; set; }
        public Guid? SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool IsInternalNote { get; set; }
        public bool IsAiGenerated { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
