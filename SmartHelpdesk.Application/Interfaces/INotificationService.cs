using System;
using System.Threading.Tasks;

namespace SmartHelpdesk.Application.Interfaces
{
    public interface INotificationService
    {
        Task SendToUserAsync(Guid userId, string title, string message);
        Task SendToAllAgentsAsync(string title, string message);
    }
}
