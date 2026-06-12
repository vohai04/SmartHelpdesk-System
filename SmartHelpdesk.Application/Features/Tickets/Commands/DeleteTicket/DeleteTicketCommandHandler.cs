using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Tickets.Commands.DeleteTicket
{
    public class DeleteTicketCommandHandler : IRequestHandler<DeleteTicketCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;

        public DeleteTicketCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(DeleteTicketCommand request, CancellationToken cancellationToken)
        {
            var ticketRepo = _unitOfWork.Repository<Ticket>();
            var ticket = await ticketRepo.GetByIdAsync(request.Id);

            if (ticket == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy Ticket với Id {request.Id}");
            }

            ticketRepo.Delete(ticket);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
