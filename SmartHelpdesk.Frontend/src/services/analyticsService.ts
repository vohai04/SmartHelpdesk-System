import { axiosClient } from '../api/axiosClient';

export interface DashboardMetricsDto {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  urgentTickets: number;
  averageResolutionTimeHours: number;
  aiTriageRate: number;
  ticketsByStatus: Record<string, number>;
  ticketsByPriority: Record<string, number>;
}

export const analyticsService = {
  getDashboardMetrics: async (): Promise<DashboardMetricsDto> => {
    return axiosClient.get("/analytics/dashboard") as Promise<DashboardMetricsDto>;
  }
};
