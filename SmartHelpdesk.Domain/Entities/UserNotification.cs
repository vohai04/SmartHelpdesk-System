namespace SmartHelpdesk.Domain.Entities;

public class UserNotification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EventId { get; set; }
    public Guid RecipientId { get; set; }
    public Guid? TicketId { get; set; }
    public string? MessageId { get; set; }
    public string Title { get; set; } = "";
    public string Message { get; set; } = "";
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public bool Read { get; set; }
    public bool Dismissed { get; set; }
}
