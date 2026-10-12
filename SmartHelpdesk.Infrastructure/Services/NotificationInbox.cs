using Microsoft.EntityFrameworkCore;
using SmartHelpdesk.Application.Interfaces;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Enums;
using SmartHelpdesk.Infrastructure.Persistence;
namespace SmartHelpdesk.Infrastructure.Services;

public class NotificationInbox(ApplicationDbContext db) : INotificationInbox
{
    private IQueryable<UserNotification> Visible(Guid userId) => db.UserNotifications.Where(n =>
        n.RecipientId == userId && !n.Dismissed && db.Users.Any(u => u.Id == userId && u.IsActive &&
        (u.Role != UserRole.Customer || (n.TicketId != null && db.Tickets.Any(t => t.Id == n.TicketId && t.CreatedById == userId)))));

    public async Task<NotificationInboxPage> GetAsync(Guid userId, CancellationToken token)
    {
        var rows = Visible(userId);
        var count = await rows.CountAsync(n => !n.Read, token);
        var items = await rows.AsNoTracking().OrderByDescending(n => n.Date).ThenByDescending(n => n.Id).Take(50).ToListAsync(token);
        return new(items, count);
    }

    public async Task UpdateAsync(Guid userId, Guid[] ids, bool dismiss, CancellationToken token)
    {
        var rows = Visible(userId).Where(n => ids.Contains(n.Id));
        if (dismiss) await rows.ExecuteUpdateAsync(s => s.SetProperty(n => n.Read, true).SetProperty(n => n.Dismissed, true), token);
        else await rows.ExecuteUpdateAsync(s => s.SetProperty(n => n.Read, true), token);
    }
}
