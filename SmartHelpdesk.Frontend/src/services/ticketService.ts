import { axiosClient } from '../api/axiosClient';

// --- DTOs matching backend TicketDto ---
export interface TicketDto {
  id: string;
  title: string;
  description: string;
  status: string;         // "Open" | "InProgress" | "Resolved" | "Closed"
  priority: string;       // "Low" | "Medium" | "High" | "Urgent"
  categoryId: string | null;
  createdById: string;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface PagedList<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface GetTicketsParams {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
}

export const ticketService = {
  getTickets: async (params?: GetTicketsParams): Promise<PagedList<TicketDto>> => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', String(params.pageNumber));
    if (params?.pageSize)   query.append('pageSize',   String(params.pageSize));
    if (params?.keyword)    query.append('keyword',    params.keyword);

    return axiosClient.get(`/tickets?${query.toString()}`) as Promise<PagedList<TicketDto>>;
  },

  deleteTicket: async (id: string): Promise<void> => {
    return axiosClient.delete(`/tickets/${id}`);
  },
};
