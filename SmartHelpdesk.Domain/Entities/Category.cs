using System.Collections.Generic;
using SmartHelpdesk.Domain.Common;

namespace SmartHelpdesk.Domain.Entities
{
    public class Category : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? AiRoutingKeywords { get; set; } 
        
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}
