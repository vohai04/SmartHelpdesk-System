using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SmartHelpdesk.Application.Interfaces;
using SmartHelpdesk.Domain.Enums;
using SmartHelpdesk.Infrastructure.Hubs;
using SmartHelpdesk.Infrastructure.Persistence;
namespace SmartHelpdesk.Infrastructure.Services;

public class SignalRNotificationService(IHubContext<NotificationHub> hub, ApplicationDbContext db) : INotificationService
{
    public async Task SendTicketUpdateAsync(Guid ownerId, TicketRealtimeUpdate update)
    {
        await hub.Clients.Group("Agents").SendAsync("TicketTriageUpdated", update);
        await hub.Clients.User(ownerId.ToString()).SendAsync("TicketTriageUpdated", update);
    }

    public async Task SendToAllAgentsAsync(string title, string message, string? ticketId = null, string? messageId = null, Guid? eventId = null)
    {
        var recipients = await db.Users.Where(u => u.IsActive && (u.Role == UserRole.Agent || u.Role == UserRole.Admin)).Select(u => u.Id).ToListAsync();
        var notificationEvent = eventId ?? Guid.NewGuid();
        foreach (var recipient in recipients) await SendToUserAsync(recipient, title, message, ticketId, messageId, notificationEvent);
    }

    public async Task SendToUserAsync(Guid userId, string title, string message, string? ticketId = null, string? messageId = null, Guid? eventId = null)
    {
        if (!await db.Users.AnyAsync(u => u.Id == userId && u.IsActive)) return;
        var notificationEvent = eventId ?? Guid.NewGuid();
        var id = Guid.NewGuid();
        Guid? ticket = Guid.TryParse(ticketId, out var parsed) ? parsed : null;
        var date = DateTime.UtcNow;
        // Persist before pushing. A retried durable job reuses its event/recipient pair.
        await db.Database.ExecuteSqlInterpolatedAsync($@"INSERT INTO ""UserNotifications""
            (""Id"", ""EventId"", ""RecipientId"", ""TicketId"", ""MessageId"", ""Title"", ""Message"", ""Date"", ""Read"", ""Dismissed"")
            VALUES ({id}, {notificationEvent}, {userId}, {ticket}, {messageId}, {title}, {message}, {date}, FALSE, FALSE)
            ON CONFLICT (""EventId"", ""RecipientId"") DO NOTHING");
        var notification = await db.UserNotifications.AsNoTracking().SingleAsync(n => n.EventId == notificationEvent && n.RecipientId == userId);
        if (!notification.Dismissed) await hub.Clients.User(userId.ToString()).SendAsync("ReceiveNotification", notification);
    }
}
