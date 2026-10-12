using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SmartHelpdesk.Infrastructure.Hubs
{
    [Authorize]
    public class NotificationHub(SmartHelpdesk.Infrastructure.Services.AccountSessions sessions) : Hub
    {
        public override async Task OnConnectedAsync()
        {
            sessions.Add(Context);
            var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            if (role == "Admin" || role == "Agent")
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "Agents");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            sessions.Remove(Context.ConnectionId);
            var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            if (role == "Admin" || role == "Agent")
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, "Agents");
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}
