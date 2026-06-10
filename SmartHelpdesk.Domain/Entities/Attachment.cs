using System;
using SmartHelpdesk.Domain.Common;

namespace SmartHelpdesk.Domain.Entities
{
    public class Attachment : BaseEntity
    {
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string ContentType { get; set; } = string.Empty; 
        
        public Guid? TicketId { get; set; }
        public Guid? TicketMessageId { get; set; }
        public Guid UploadedById { get; set; }
    }
}
