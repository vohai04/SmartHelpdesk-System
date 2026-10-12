using System.Threading;
using System.Threading.Tasks;

namespace SmartHelpdesk.Application.Interfaces
{
    public class AiTriageResult
    {
        public string Priority { get; set; } = string.Empty;
        public string Sentiment { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
    }

    public interface IAiService
    {
        Task<string> SuggestReplyAsync(string ticketTitle, string ticketDescription, string chatHistory, string currentUserName, string currentUserRole, CancellationToken cancellationToken = default);
        Task<AiTriageResult> AnalyzeTicketTriageAsync(string title, string description, CancellationToken cancellationToken = default);
    }
}
