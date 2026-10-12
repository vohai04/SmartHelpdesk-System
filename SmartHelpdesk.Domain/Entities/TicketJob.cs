using SmartHelpdesk.Domain.Common;
namespace SmartHelpdesk.Domain.Entities;
public enum TicketJobKind { Triage, Email, Realtime, CreatedNotification, Notification, TransferReminder }
public enum TicketJobStatus { Queued, Processing, Completed, Failed }
public class TicketJob : BaseEntity
{
    public Guid? RecipientId { get; set; }
    public string? Title { get; set; }
    public string? Message { get; set; }
    public string? MessageId { get; set; }
    public Guid TicketId { get; set; }
    public TicketJobKind Kind { get; set; }
    public TicketJobStatus Status { get; set; }
    public int Attempts { get; set; }
    public DateTime NextAttemptAt { get; set; } = DateTime.UtcNow;
    public Guid? LeaseId { get; set; }
    public string? LastError { get; set; }
}
