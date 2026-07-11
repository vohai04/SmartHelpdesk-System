using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SmartHelpdesk.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace SmartHelpdesk.Infrastructure.Services
{
    public class AiProcessingBackgroundService : BackgroundService
    {
        private readonly IBackgroundTaskQueue _taskQueue;
        private readonly ILogger<AiProcessingBackgroundService> _logger;
        private readonly IServiceProvider _serviceProvider;

        public AiProcessingBackgroundService(
            IBackgroundTaskQueue taskQueue,
            ILogger<AiProcessingBackgroundService> logger,
            IServiceProvider serviceProvider)
        {
            _taskQueue = taskQueue;
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AI Processing Background Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                var workItem = await _taskQueue.DequeueAsync(stoppingToken);

                try
                {
                    _logger.LogInformation("Starting a new AI background job.");
                    await workItem(_serviceProvider, stoppingToken);
                    _logger.LogInformation("AI background job completed successfully.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing AI background job.");
                }
            }

            _logger.LogInformation("AI Processing Background Service is stopping.");
        }
    }
}
