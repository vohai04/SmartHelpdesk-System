import { axiosClient } from '../api/axiosClient';

export interface UserManagementDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isDeleted: boolean;
  createdAt: string;
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

export interface GetUsersParams {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  role?: string;
  includeDeleted?: boolean;
}

export interface UpdateUserRequest {
  fullName?: string;
  role?: string;
}

export const userService = {
  getUsers: async (params?: GetUsersParams): Promise<PagedList<UserManagementDto>> => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', String(params.pageNumber));
    if (params?.pageSize)   query.append('pageSize',   String(params.pageSize));
    if (params?.keyword)    query.append('keyword',    params.keyword);
    if (params?.role)       query.append('role',       params.role);
    if (params?.includeDeleted !== undefined) query.append('includeDeleted', String(params.includeDeleted));

    return axiosClient.get(`/users?${query.toString()}`) as Promise<PagedList<UserManagementDto>>;
  },

  getUserById: async (id: string): Promise<UserManagementDto> => {
    return axiosClient.get(`/users/${id}`) as Promise<UserManagementDto>;
  },

  updateUser: async (id: string, data: UpdateUserRequest): Promise<UserManagementDto> => {
    return axiosClient.put(`/users/${id}`, data) as Promise<UserManagementDto>;
  },

  softDeleteUser: async (id: string): Promise<void> => {
    return axiosClient.delete(`/users/${id}`);
  },

  restoreUser: async (id: string): Promise<void> => {
    return axiosClient.post(`/users/${id}/restore`, {});
  },

  updateUserRole: async (id: string, role: number): Promise<void> => {
    return axiosClient.put(`/users/${id}/role`, { role });
  },
};
