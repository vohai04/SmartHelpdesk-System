using System.Threading.Tasks;

namespace SmartHelpdesk.Domain.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
    }
}
