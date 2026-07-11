using System.Collections.Generic;

namespace SmartHelpdesk.Application.Features.Analytics.DTOs
{
    public class DashboardMetricsDto
    {
        public int TotalTickets { get; set; }
        public int OpenTickets { get; set; }
        public int ResolvedTickets { get; set; }
        public int UrgentTickets { get; set; }
        public double AverageResolutionTimeHours { get; set; }
        public double AiTriageRate { get; set; }
        
        public Dictionary<string, int> TicketsByStatus { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> TicketsByPriority { get; set; } = new Dictionary<string, int>();
    }
}
