import type { TicketRealtimeUpdate } from './signalrService';
import { axiosClient } from '../api/axiosClient';

// --- DTOs matching backend TicketDto ---
export interface TicketDto {
  id: string;
  title: string;
  description: string;
  status: string;         // "Open" | "InProgress" | "Resolved" | "Closed"
  priority: string | null;
  triageStatus: TicketRealtimeUpdate["triageStatus"];
  prioritySource: TicketRealtimeUpdate["prioritySource"];
  version: number;       // "Low" | "Medium" | "High" | "Urgent"
  categoryId: string | null;
  categoryName: string;
  createdById: string;
  createdByName: string;
  assignedToId: string | null;
  assignedToName?: string;
  transferRequestedById: string | null;
  transferTargetId: string | null;
  transferReason: string | null;
  transferRequestedAt: string | null;
  startedAt: string | null;
  resolution: string | null;
  closureReason: string | null;
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
  assignmentFilter?: string; // "Unassigned" | "AssignedToMe"
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  categoryId: string;
  requesterId?: string;
}

export const ticketService = {
  getTickets: async (params?: GetTicketsParams): Promise<PagedList<TicketDto>> => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', String(params.pageNumber));
    if (params?.pageSize)   query.append('pageSize',   String(params.pageSize));
    if (params?.keyword)    query.append('keyword',    params.keyword);
    if (params?.status)     query.append('status',     params.status);
    if (params?.priority)   query.append('priority',   params.priority);
    if (params?.assignmentFilter) query.append('assignmentFilter', params.assignmentFilter);

    return axiosClient.get(`/tickets?${query.toString()}`) as Promise<PagedList<TicketDto>>;
  },

  getTicketById: async (id: string): Promise<TicketDto> => {
    return axiosClient.get(`/tickets/${id}`);
  },

  updateTicket: async (id: string, data: { status?: string; priority?: string; assignedToId?: string | null; expectedVersion?: number }): Promise<TicketDto> => {
    return axiosClient.put(`/tickets/${id}`, data);
  },

  action: async (id: string, data: { action: string; expectedVersion: number; reason?: string; assignedToId?: string | null }): Promise<TicketDto> => axiosClient.post(`/tickets/${id}/actions`, data),

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

export function priorityLabel(ticket:Pick<TicketDto,'priority'|'triageStatus'>) {
  if(ticket.priority) return ticket.priority;
  return ticket.triageStatus==='Failed'?'Needs manual triage':ticket.triageStatus==='NotRequested'?'Unclassified':'Classifying…';
}
export function applyTicketUpdate(ticket:TicketDto,update:TicketRealtimeUpdate):TicketDto {
  if(ticket.id!==update.ticketId || ticket.version>=update.version) return ticket;
  return {...ticket,assignedToId:update.assignedToId,assignedToName:update.assignedToName ?? undefined,status:update.status,priority:update.priority,triageStatus:update.triageStatus,prioritySource:update.prioritySource,version:update.version};
}
