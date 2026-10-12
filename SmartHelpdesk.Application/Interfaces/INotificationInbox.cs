using SmartHelpdesk.Domain.Entities;
namespace SmartHelpdesk.Application.Interfaces;
public record NotificationInboxPage(IReadOnlyList<UserNotification> Items, int UnreadCount);
public interface INotificationInbox
{
    Task<NotificationInboxPage> GetAsync(Guid userId, CancellationToken token);
    Task UpdateAsync(Guid userId, Guid[] ids, bool dismiss, CancellationToken token);
}
