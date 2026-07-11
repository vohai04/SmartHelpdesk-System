import { axiosClient } from '../api/axiosClient';

// --- DTOs matching backend TicketDto ---
export interface TicketDto {
  id: string;
  title: string;
  description: string;
  status: string;         // "Open" | "InProgress" | "Resolved" | "Closed"
  priority: string;       // "Low" | "Medium" | "High" | "Urgent"
  categoryId: string | null;
  categoryName: string;
  createdById: string;
  createdByName: string;
  assignedToId: string | null;
  assignedToName?: string;
  isAiTriaged: boolean;
  aiSentiment?: string;
  aiSummary?: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface AttachmentDto {
  id: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
}

export interface TicketMessageDto {
  id: string;
  ticketId: string;
  senderId: string | null;
  senderName: string;
  content: string;
  isInternalNote: boolean;
  isAiGenerated: boolean;
  createdAt: string;
  attachments?: AttachmentDto[];
}

export interface AgentDto {
  id: string;
  fullName: string;
  email: string;
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
  status?: string;
  priority?: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  categoryId: string;
}

export const ticketService = {
  getTickets: async (params?: GetTicketsParams): Promise<PagedList<TicketDto>> => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', String(params.pageNumber));
    if (params?.pageSize)   query.append('pageSize',   String(params.pageSize));
    if (params?.keyword)    query.append('keyword',    params.keyword);
    if (params?.status)     query.append('status',     params.status);
    if (params?.priority)   query.append('priority',   params.priority);

    return axiosClient.get(`/tickets?${query.toString()}`) as Promise<PagedList<TicketDto>>;
  },

  getTicketById: async (id: string): Promise<TicketDto> => {
    return axiosClient.get(`/tickets/${id}`);
  },

  updateTicket: async (id: string, data: { status?: string; priority?: string; assignedToId?: string | null }): Promise<void> => {
    return axiosClient.put(`/tickets/${id}`, data);
  },

  deleteTicket: async (id: string): Promise<void> => {
    return axiosClient.delete(`/tickets/${id}`);
  },

  createTicket: async (data: CreateTicketRequest): Promise<{ id: string }> => {
    return axiosClient.post('/tickets', data) as Promise<{ id: string }>;
  },

  getMessages: async (ticketId: string, pageNumber = 1, pageSize = 50): Promise<PagedList<TicketMessageDto>> => {
    return axiosClient.get(`/tickets/${ticketId}/messages?pageNumber=${pageNumber}&pageSize=${pageSize}`);
  },

  sendMessage: async (ticketId: string, content: string, isInternalNote: boolean, attachmentIds?: string[]): Promise<TicketMessageDto> => {
    return axiosClient.post(`/tickets/${ticketId}/messages`, { ticketId, content, isInternalNote, attachmentIds });
  },

  uploadAttachment: async (file: File, ticketId: string): Promise<AttachmentDto> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ticketId', ticketId);
    
    return axiosClient.post('/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  suggestReply: async (ticketId: string): Promise<{ suggestion: string }> => {
    return axiosClient.get(`/tickets/${ticketId}/ai/suggest-reply`);
  },

  getAgents: async (): Promise<AgentDto[]> => {
    return axiosClient.get('/tickets/agents');
  }
};
