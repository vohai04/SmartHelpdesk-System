using System;

namespace SmartHelpdesk.Application.Features.Tickets.DTOs
{
    public class TicketDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Priority { get; set; }
        public string TriageStatus { get; set; } = string.Empty;
        public string PrioritySource { get; set; } = string.Empty;
        public int Version { get; set; }
        public Guid CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public Guid CreatedById { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public Guid? AssignedToId { get; set; }
        public string? AssignedToName { get; set; }
        public Guid? TransferRequestedById { get; set; }
        public Guid? TransferTargetId { get; set; }
        public string? TransferReason { get; set; }
        public DateTime? TransferRequestedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public string? Resolution { get; set; }
        public string? ClosureReason { get; set; }
        public bool IsAiTriaged { get; set; }
        public string? AiSentiment { get; set; }
        public string? AiSummary { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
