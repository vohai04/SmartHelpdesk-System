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

        public CreateTicketCommandHandler(IUnitOfWork unitOfWork, IMediator mediator, INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _mediator = mediator;
            _notificationService = notificationService;
        }

        public async Task<Guid> Handle(CreateTicketCommand request, CancellationToken cancellationToken)
        {
            var ticket = new Ticket
            {
                Title = request.Title,
                Description = request.Description,
                Priority = request.Priority,
                CategoryId = request.CategoryId,
                CreatedById = request.CreatedById
            };

            await _unitOfWork.Repository<Ticket>().AddAsync(ticket);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var userRepo = _unitOfWork.Repository<User>();
            var customer = await userRepo.GetByIdAsync(request.CreatedById);

            if (customer != null && !string.IsNullOrEmpty(customer.Email))
            {
                await _mediator.Publish(new TicketCreatedEvent(
                    ticket.Id,
                    ticket.Title,
                    customer.FullName,
                    customer.Email
                ), cancellationToken);
            }

            await _notificationService.SendToAllAgentsAsync(
                "Ticket Mới", 
                $"Một Ticket mới vừa được tạo bởi {customer?.FullName}."
            );

            return ticket.Id;
        }
    }
}
