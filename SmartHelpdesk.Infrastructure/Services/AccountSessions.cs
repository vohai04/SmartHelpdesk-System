using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using SmartHelpdesk.Application.Interfaces;
namespace SmartHelpdesk.Infrastructure.Services;
public class AccountSessions : IAccountSessions
{
    private readonly ConcurrentDictionary<string, HubCallerContext> connections = new();
    public void Add(HubCallerContext context) => connections[context.ConnectionId] = context;
    public void Remove(string id) => connections.TryRemove(id, out _);
    public Task RevokeAsync(Guid userId)
    {
        foreach (var entry in connections.Values.Where(c => c.UserIdentifier == userId.ToString())) entry.Abort();
        return Task.CompletedTask;
    }
}
