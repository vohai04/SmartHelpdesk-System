using System;
using System.Collections.Generic;
using SmartHelpdesk.Domain.Common;
using SmartHelpdesk.Domain.Enums;

namespace SmartHelpdesk.Domain.Entities
{
    public class Ticket : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        
        public TicketStatus Status { get; set; } = TicketStatus.Open;
        public TicketPriority? Priority { get; set; }
        public TriageStatus TriageStatus { get; set; } = TriageStatus.NotRequested;
        public PrioritySource PrioritySource { get; set; } = PrioritySource.Legacy;
        public int Version { get; set; }
        
        public Guid CategoryId { get; set; }
        public Guid CreatedById { get; set; } 
        public Guid? TransferRequestedById { get; set; }
        public Guid? TransferTargetId { get; set; }
        public string? TransferReason { get; set; }
        public DateTime? TransferRequestedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string? Resolution { get; set; }
        public string? ClosureReason { get; set; }
        public Guid? AssignedToId { get; set; } 
        
        public bool IsAiTriaged { get; set; } = false; 
        public string? AiSentiment { get; set; } 
        public string? AiSummary { get; set; } 

        public Category Category { get; set; } = null!;
        public User CreatedBy { get; set; } = null!;
        public User? AssignedTo { get; set; }
        public ICollection<TicketMessage> Messages { get; set; } = new List<TicketMessage>();
        public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    }
}
