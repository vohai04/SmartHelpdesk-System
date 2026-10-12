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

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                if (System.Enum.TryParse<SmartHelpdesk.Domain.Enums.TicketStatus>(request.Status, true, out var statusEnum))
                {
                    query = query.Where(t => t.Status == statusEnum);
                }
            }

            if (!string.IsNullOrWhiteSpace(request.Priority))
            {
                if (request.Priority == "Unclassified") query=query.Where(t=>t.Priority==null);
                else if (System.Enum.TryParse<SmartHelpdesk.Domain.Enums.TicketPriority>(request.Priority, true, out var priorityEnum))
                {
                    query = query.Where(t => t.Priority == priorityEnum);
                }
            }

            if (request.CurrentUserRole == "Admin" || request.CurrentUserRole == "Agent")
            {
                if (request.AssignmentFilter == "PendingHandover") query = query.Where(t => t.TransferRequestedAt != null);
                else if (request.AssignmentFilter == "NeedsCoordination") query = query.Where(t => t.Status != Domain.Enums.TicketStatus.Closed && t.Status != Domain.Enums.TicketStatus.Resolved && (t.AssignedToId == null || t.AssignedTo == null || !t.AssignedTo.IsActive || t.AssignedTo.Role != Domain.Enums.UserRole.Agent));
                else if (request.AssignmentFilter == "Unassigned")
                {
                    query = query.Where(t => t.AssignedToId == null);
                }
                else if (request.AssignmentFilter == "AssignedToMe")
                {
                    query = query.Where(t => t.AssignedToId == request.CurrentUserId);
                }
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
                    Priority = t.Priority.HasValue ? t.Priority.Value.ToString() : null,
                    TriageStatus = t.TriageStatus.ToString(), PrioritySource=t.PrioritySource.ToString(), Version=t.Version,
                    CategoryId = t.CategoryId,
                    CategoryName = t.Category != null ? t.Category.Name : string.Empty,
                    CreatedById = t.CreatedById,
                    CreatedByName = t.CreatedBy != null ? t.CreatedBy.FullName : string.Empty,
                    AssignedToId = t.AssignedToId,
                    AssignedToName = t.AssignedTo != null ? t.AssignedTo.FullName : null,
                    TransferRequestedById = request.CurrentUserRole == "Customer" ? null : t.TransferRequestedById,
                    TransferTargetId = request.CurrentUserRole == "Customer" ? null : t.TransferTargetId,
                    TransferReason = request.CurrentUserRole == "Customer" ? null : t.TransferReason,
                    TransferRequestedAt = request.CurrentUserRole == "Customer" ? null : t.TransferRequestedAt,
                    StartedAt = t.StartedAt, Resolution = t.Resolution, ClosureReason = t.ClosureReason,
                    IsAiTriaged = request.CurrentUserRole != "Customer" ? t.IsAiTriaged : false,
                    AiSentiment = request.CurrentUserRole != "Customer" ? t.AiSentiment : null,
                    AiSummary = request.CurrentUserRole != "Customer" ? t.AiSummary : null,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .ToListAsync(cancellationToken);

            return new PagedList<TicketDto>(tickets, totalCount, request.PageNumber, request.PageSize);
        }
    }
}
