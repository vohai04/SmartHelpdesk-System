using System;

namespace SmartHelpdesk.Application.Features.Attachments.DTOs
{
    public class AttachmentDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string ContentType { get; set; } = string.Empty;
        public Guid? TicketId { get; set; }
        public Guid? TicketMessageId { get; set; }
        public Guid UploadedById { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
