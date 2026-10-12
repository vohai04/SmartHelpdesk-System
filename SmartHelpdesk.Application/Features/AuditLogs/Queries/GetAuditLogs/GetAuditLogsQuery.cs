using MediatR;
using SmartHelpdesk.Domain.Common;
using SmartHelpdesk.Application.Features.AuditLogs.DTOs;

namespace SmartHelpdesk.Application.Features.AuditLogs.Queries.GetAuditLogs
{
    public class GetAuditLogsQuery : IRequest<PagedList<AuditLogDto>>
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
