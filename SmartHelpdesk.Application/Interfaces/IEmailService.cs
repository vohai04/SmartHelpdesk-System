using System.Threading.Tasks;

namespace SmartHelpdesk.Application.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
    }
}
