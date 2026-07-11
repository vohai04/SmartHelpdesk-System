using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SmartHelpdesk.Application.Features.Tickets.DTOs;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Tickets.Queries.GetTicketById
{
    public class GetTicketByIdQueryHandler : IRequestHandler<GetTicketByIdQuery, TicketDto?>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetTicketByIdQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<TicketDto?> Handle(GetTicketByIdQuery request, CancellationToken cancellationToken)
        {
            var query = _unitOfWork.Repository<Ticket>().GetQueryable()
                .Where(t => t.Id == request.Id);

            if (request.CurrentUserRole == SmartHelpdesk.Domain.Enums.UserRole.Customer.ToString())
            {
                query = query.Where(t => t.CreatedById == request.CurrentUserId);
            }

            var ticket = await query.Select(t => new TicketDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    Status = t.Status.ToString(),
                    Priority = t.Priority.ToString(),
                    CategoryId = t.CategoryId,
                    CategoryName = t.Category != null ? t.Category.Name : string.Empty,
                    CreatedById = t.CreatedById,
                    CreatedByName = t.CreatedBy != null ? t.CreatedBy.FullName : string.Empty,
                    AssignedToId = t.AssignedToId,
                    AssignedToName = t.AssignedTo != null ? t.AssignedTo.FullName : null,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .FirstOrDefaultAsync(cancellationToken);

            return ticket;
        }
    }
}
