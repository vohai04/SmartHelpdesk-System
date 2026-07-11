import { axiosClient } from '../api/axiosClient';

export interface CategoryDto {
  id: string;
  name: string;
  description: string;
  aiRoutingKeywords?: string;
  isDeleted: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  aiRoutingKeywords?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description: string;
  aiRoutingKeywords?: string;
}

export const categoryService = {
  getCategories: async (): Promise<CategoryDto[]> => {
    return axiosClient.get("/categories") as Promise<CategoryDto[]>;
  },

  createCategory: async (request: CreateCategoryRequest): Promise<{ id: string }> => {
    return axiosClient.post("/categories", request) as Promise<{ id: string }>;
  },

  updateCategory: async (id: string, request: UpdateCategoryRequest): Promise<void> => {
    await axiosClient.put(`/categories/${id}`, request);
  },

  deleteCategory: async (id: string): Promise<void> => {
    await axiosClient.delete(`/categories/${id}`);
  }
};
