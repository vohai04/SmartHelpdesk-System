using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using SmartHelpdesk.Application.Interfaces;
using SmartHelpdesk.Infrastructure.Configurations;
namespace SmartHelpdesk.Infrastructure.Services;
public class EmailService(IOptions<EmailSettings> options) : IEmailService
{
    public async Task SendEmailAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        var settings = options.Value;
        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(settings.FromName, settings.FromAddress));
        email.To.Add(MailboxAddress.Parse(to)); email.Subject = subject;
        email.Body = new BodyBuilder { HtmlBody = body }.ToMessageBody();
        using var smtp = new SmtpClient { Timeout = 20000 };
        // Keep normal certificate validation. Failures are retried by the durable email lane.
        await smtp.ConnectAsync(settings.Host, settings.Port, SecureSocketOptions.StartTls, cancellationToken);
        if (!string.IsNullOrWhiteSpace(settings.Username))
            await smtp.AuthenticateAsync(settings.Username, settings.Password, cancellationToken);
        await smtp.SendAsync(email, cancellationToken);
        await smtp.DisconnectAsync(true, cancellationToken);
    }
}
