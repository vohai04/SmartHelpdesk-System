using MediatR;
using SmartHelpdesk.Application.Features.Analytics.DTOs;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Enums;
using SmartHelpdesk.Domain.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SmartHelpdesk.Application.Features.Analytics.Queries.GetDashboardMetrics
{
    public class GetDashboardMetricsQueryHandler : IRequestHandler<GetDashboardMetricsQuery, DashboardMetricsDto>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetDashboardMetricsQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<DashboardMetricsDto> Handle(GetDashboardMetricsQuery request, CancellationToken cancellationToken)
        {
            var repository = _unitOfWork.Repository<Ticket>();
            var allTickets = await repository.GetAllAsync();
            var tickets = allTickets.Where(t => !t.IsDeleted).ToList();

            var metrics = new DashboardMetricsDto
            {
                TotalTickets = tickets.Count,
                OpenTickets = tickets.Count(t => t.Status == TicketStatus.Open || t.Status == TicketStatus.InProgress),
                ResolvedTickets = tickets.Count(t => t.Status == TicketStatus.Resolved || t.Status == TicketStatus.Closed),
                UrgentTickets = tickets.Count(t => t.Priority == TicketPriority.Urgent)
            };

            // Average Resolution Time for Resolved/Closed tickets
            var resolvedTicketsList = tickets.Where(t => (t.Status == TicketStatus.Resolved || t.Status == TicketStatus.Closed) && t.UpdatedAt.HasValue).ToList();
            if (resolvedTicketsList.Any())
            {
                var totalHours = resolvedTicketsList.Sum(t => (t.UpdatedAt!.Value - t.CreatedAt).TotalHours);
                metrics.AverageResolutionTimeHours = Math.Round(totalHours / resolvedTicketsList.Count, 1);
            }

            // AI Triage Rate
            if (tickets.Any())
            {
                var aiTriagedCount = tickets.Count(t => t.IsAiTriaged);
                metrics.AiTriageRate = Math.Round((double)aiTriagedCount / tickets.Count * 100, 1);
            }

            // Group by Status
            metrics.TicketsByStatus = tickets.GroupBy(t => t.Status.ToString())
                                             .ToDictionary(g => g.Key, g => g.Count());

            // Group by Priority
            metrics.TicketsByPriority = tickets.GroupBy(t => t.Priority.ToString())
                                               .ToDictionary(g => g.Key, g => g.Count());

            return metrics;
        }
    }
}
