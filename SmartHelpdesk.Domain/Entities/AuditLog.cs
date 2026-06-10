using System;
using SmartHelpdesk.Domain.Common;

namespace SmartHelpdesk.Domain.Entities
{
    public class AuditLog : BaseEntity
    {
        public Guid? UserId { get; set; } 
        public string Action { get; set; } = string.Empty;
        public string EntityName { get; set; } = string.Empty;
        public Guid EntityId { get; set; }
        public string? OldValues { get; set; } 
        public string? NewValues { get; set; } 
    }
}
