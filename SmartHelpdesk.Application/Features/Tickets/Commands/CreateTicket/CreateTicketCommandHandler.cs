using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Application.Features.Tickets.Events;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Tickets.Commands.CreateTicket
{
    public class CreateTicketCommandHandler : IRequestHandler<CreateTicketCommand, Guid>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMediator _mediator;

        public CreateTicketCommandHandler(IUnitOfWork unitOfWork, IMediator mediator)
        {
            _unitOfWork = unitOfWork;
            _mediator = mediator;
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

            return ticket.Id;
        }
    }
}
