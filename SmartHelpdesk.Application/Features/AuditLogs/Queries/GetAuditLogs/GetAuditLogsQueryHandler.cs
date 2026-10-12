using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SmartHelpdesk.Domain.Common;
using SmartHelpdesk.Application.Features.AuditLogs.DTOs;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.AuditLogs.Queries.GetAuditLogs
{
    public class GetAuditLogsQueryHandler : IRequestHandler<GetAuditLogsQuery, PagedList<AuditLogDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetAuditLogsQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<PagedList<AuditLogDto>> Handle(GetAuditLogsQuery request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.Repository<AuditLog>();
            var query = repo.GetQueryable().OrderByDescending(a => a.CreatedAt);

            var totalCount = await query.CountAsync(cancellationToken);

            var logs = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    Action = a.Action,
                    EntityName = a.EntityName,
                    EntityId = a.EntityId,
                    OldValues = a.OldValues,
                    NewValues = a.NewValues,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync(cancellationToken);

            return new PagedList<AuditLogDto>(logs, totalCount, request.PageNumber, request.PageSize);
        }
    }
}
