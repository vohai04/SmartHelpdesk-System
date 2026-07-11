import { axiosClient } from '../api/axiosClient';

export interface CategoryDto {
  id: string;
  name: string;
  description: string;
}

export const categoryService = {
  getCategories: async (): Promise<CategoryDto[]> => {
    // Fetch real categories from the backend API
    const res = await axiosClient.get('/categories') as CategoryDto[];
    return res;
  },
};
