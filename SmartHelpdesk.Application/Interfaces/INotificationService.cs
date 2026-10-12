using System;
using System.Threading.Tasks;

namespace SmartHelpdesk.Application.Interfaces
{
    public interface INotificationService
    {
        Task SendTicketUpdateAsync(Guid ownerId, TicketRealtimeUpdate update);
        Task SendToUserAsync(Guid userId, string title, string message, string? ticketId = null, string? messageId = null, Guid? eventId = null);
        Task SendToAllAgentsAsync(string title, string message, string? ticketId = null, string? messageId = null, Guid? eventId = null);
    }
}

namespace SmartHelpdesk.Application.Interfaces { public record TicketRealtimeUpdate(Guid TicketId, string Status, string? Priority, string TriageStatus, string PrioritySource, int Version, Guid? AssignedToId, string? AssignedToName, bool TransferPending); }
