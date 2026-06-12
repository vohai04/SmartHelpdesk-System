using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Tickets.Commands.CreateTicket
{
    public class CreateTicketCommandHandler : IRequestHandler<CreateTicketCommand, Guid>
    {
        private readonly IUnitOfWork _unitOfWork;

        public CreateTicketCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
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

            return ticket.Id;
        }
    }
}
