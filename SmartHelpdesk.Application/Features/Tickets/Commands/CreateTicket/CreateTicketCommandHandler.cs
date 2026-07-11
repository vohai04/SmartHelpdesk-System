using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Application.Features.Tickets.Events;
using SmartHelpdesk.Application.Interfaces;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Tickets.Commands.CreateTicket
{
    public class CreateTicketCommandHandler : IRequestHandler<CreateTicketCommand, Guid>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMediator _mediator;
        private readonly INotificationService _notificationService;
        private readonly IBackgroundTaskQueue _backgroundTaskQueue;

        public CreateTicketCommandHandler(
            IUnitOfWork unitOfWork, 
            IMediator mediator, 
            INotificationService notificationService, 
            IBackgroundTaskQueue backgroundTaskQueue)
        {
            _unitOfWork = unitOfWork;
            _mediator = mediator;
            _notificationService = notificationService;
            _backgroundTaskQueue = backgroundTaskQueue;
        }

        public async Task<Guid> Handle(CreateTicketCommand request, CancellationToken cancellationToken)
        {
            // 1. Create ticket instantly with default priority
            var ticket = new Ticket
            {
                Title = request.Title,
                Description = request.Description,
                Priority = SmartHelpdesk.Domain.Enums.TicketPriority.Medium,
                IsAiTriaged = false, // AI hasn't processed this yet
                CategoryId = request.CategoryId,
                CreatedById = request.CreatedById
            };

            await _unitOfWork.Repository<Ticket>().AddAsync(ticket);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 2. Fire and Forget AI Analysis & Email Notification Task to Background Queue
            await _backgroundTaskQueue.QueueBackgroundWorkItemAsync(async (serviceProvider, token) =>
            {
                using var scope = Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.CreateScope(serviceProvider);
                var scopedUnitOfWork = Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService<IUnitOfWork>(scope.ServiceProvider);
                var scopedMediator = Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService<IMediator>(scope.ServiceProvider);
                var scopedNotificationService = Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService<INotificationService>(scope.ServiceProvider);
                
                var userRepo = scopedUnitOfWork.Repository<User>();
                var customer = await userRepo.GetByIdAsync(request.CreatedById);

                // Publish email event
                if (customer != null && !string.IsNullOrEmpty(customer.Email))
                {
                    await scopedMediator.Publish(new TicketCreatedEvent(
                        ticket.Id,
                        ticket.Title,
                        customer.FullName,
                        customer.Email
                    ), token);
                }

                // Notify agents
                await scopedNotificationService.SendToAllAgentsAsync(
                    "Ticket Mới", 
                    $"Một Ticket mới vừa được tạo bởi {customer?.FullName ?? "Unknown"}.",
                    ticket.Id.ToString()
                );

                // Run AI update
                await scopedMediator.Send(new SmartHelpdesk.Application.Features.Tickets.Commands.UpdateTicketPriority.UpdateTicketPriorityCommand
                {
                    TicketId = ticket.Id,
                    Title = ticket.Title,
                    Description = ticket.Description
                }, token);
            });

            return ticket.Id;
        }
    }
}
