using Microsoft.Extensions.Configuration;
using SmartHelpdesk.Application.Interfaces;
namespace SmartHelpdesk.Infrastructure.Services;
public class TicketWorkflowSettings(IConfiguration configuration) : ITicketWorkflowSettings
{
    public TimeSpan TransferReminderDelay => TimeSpan.FromMinutes(Math.Clamp(configuration.GetValue("TicketWorkflow:TransferReminderMinutes", 60), 1, 1440));
}
