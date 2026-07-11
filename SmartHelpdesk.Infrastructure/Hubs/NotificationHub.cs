using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SmartHelpdesk.Infrastructure.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            Console.WriteLine($"[SignalR] User Connected! ConnectionId: {Context.ConnectionId}, UserIdentifier: {Context.UserIdentifier}");
            var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            if (role == "Admin" || role == "Agent")
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "Agents");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            if (role == "Admin" || role == "Agent")
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, "Agents");
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}
