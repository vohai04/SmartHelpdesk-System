using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SmartHelpdesk.Application.Features.Tickets.DTOs;
using SmartHelpdesk.Domain.Common;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Tickets.Queries.GetTickets
{
    public class GetTicketsQueryHandler : IRequestHandler<GetTicketsQuery, PagedList<TicketDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetTicketsQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<PagedList<TicketDto>> Handle(GetTicketsQuery request, CancellationToken cancellationToken)
        {
            var query = _unitOfWork.Repository<Ticket>().GetQueryable();

            if (request.CurrentUserRole == SmartHelpdesk.Domain.Enums.UserRole.Customer.ToString())
            {
                query = query.Where(t => t.CreatedById == request.CurrentUserId);
            }

            if (!string.IsNullOrWhiteSpace(request.Keyword))
            {
                query = query.Where(t => t.Title.Contains(request.Keyword) || t.Description.Contains(request.Keyword));
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var tickets = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(t => new TicketDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    Status = t.Status.ToString(),
                    Priority = t.Priority.ToString(),
                    CategoryId = t.CategoryId,
                    CreatedById = t.CreatedById,
                    AssignedToId = t.AssignedToId,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .ToListAsync(cancellationToken);

            return new PagedList<TicketDto>(tickets, totalCount, request.PageNumber, request.PageSize);
        }
    }
}
