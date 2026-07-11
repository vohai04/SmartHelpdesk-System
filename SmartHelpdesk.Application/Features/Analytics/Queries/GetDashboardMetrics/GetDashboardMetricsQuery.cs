using MediatR;
using SmartHelpdesk.Application.Features.Analytics.DTOs;

namespace SmartHelpdesk.Application.Features.Analytics.Queries.GetDashboardMetrics
{
    public class GetDashboardMetricsQuery : IRequest<DashboardMetricsDto>
    {
    }
}
