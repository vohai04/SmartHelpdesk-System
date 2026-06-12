using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using SmartHelpdesk.Application.Interfaces;
using SmartHelpdesk.WebApi.Hubs;

namespace SmartHelpdesk.WebApi.Services
{
    public class SignalRNotificationService : INotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public SignalRNotificationService(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task SendToAllAgentsAsync(string title, string message)
        {
            await _hubContext.Clients.Group("Agents").SendAsync("ReceiveNotification", new { title, message, date = DateTime.UtcNow });
        }

        public async Task SendToUserAsync(Guid userId, string title, string message)
        {
            await _hubContext.Clients.User(userId.ToString()).SendAsync("ReceiveNotification", new { title, message, date = DateTime.UtcNow });
        }
    }
}
