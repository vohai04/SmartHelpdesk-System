using System;
using System.Collections.Generic;
using SmartHelpdesk.Domain.Common;

namespace SmartHelpdesk.Domain.Entities
{
    public class TicketMessage : BaseEntity
    {
        public Guid TicketId { get; set; }
        public Guid? SenderId { get; set; } 
        
        public string Content { get; set; } = string.Empty;
        
        public bool IsInternalNote { get; set; } = false; 
        public bool IsAiGenerated { get; set; } = false;  
        
        public Ticket Ticket { get; set; } = null!;
        public User? Sender { get; set; }
        public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    }
}
