using System.Threading;
using System.Threading.Tasks;

namespace SmartHelpdesk.Application.Interfaces
{
    public interface IAiService
    {
        Task<string> AnalyzeSentimentAsync(string content, CancellationToken cancellationToken = default);
        Task<string> SuggestReplyAsync(string content, string currentUserName, string currentUserRole, CancellationToken cancellationToken = default);
        Task<string> DeterminePriorityAsync(string title, string description, CancellationToken cancellationToken = default);
    }
}
