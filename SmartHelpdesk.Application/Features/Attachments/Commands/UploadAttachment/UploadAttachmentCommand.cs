using System;
using System.IO;
using MediatR;
using SmartHelpdesk.Application.Features.Attachments.DTOs;

namespace SmartHelpdesk.Application.Features.Attachments.Commands.UploadAttachment
{
    public class UploadAttachmentCommand : IRequest<AttachmentDto>
    {
        public Guid? TicketId { get; set; }
        public Guid? TicketMessageId { get; set; }
        public Guid UploadedById { get; set; }
        
        public Stream FileStream { get; set; } = null!;
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
    }
}
