import { axiosClient } from './axiosclient';
import { CreateDepartmentDto, Department, UpdateDepartmentDto } from '@/schemas/department';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type DepartmentRecord = {
  id: string;
  name: string;
  code: string;
  createdAt?: string;
  _count?: {
    programs?: number;
  };
};

type PaginatedResponse<T> = {
  data: T[];
  meta?: unknown;
};

const mapBackendDepartment = (department: DepartmentRecord): Department => ({
  id: department.id,
  name: department.name,
  code: department.code,
  createdAt: department.createdAt,
  programsCount: department._count?.programs ?? 0,
  totalCourses: 0,
});

export const fetchDepartments = async (search = ''): Promise<Department[]> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<DepartmentRecord>>>('/departments', {
    params: { limit: 100, search: search || undefined },
  });

  return (response.data?.data?.data ?? []).map(mapBackendDepartment);
};

export const createDepartment = async (department: CreateDepartmentDto): Promise<Department> => {
  const response = await axiosClient.post<ApiEnvelope<DepartmentRecord>>('/departments', department);
  if (!response.data?.data) throw new Error('Created department not found in API response');
  return mapBackendDepartment(response.data.data);
};

export const updateDepartment = async ({ id, data }: { id: string; data: UpdateDepartmentDto }): Promise<Department> => {
  const response = await axiosClient.put<ApiEnvelope<DepartmentRecord>>(`/departments/${id}`, data);
  if (!response.data?.data) throw new Error('Updated department not found in API response');
  return mapBackendDepartment(response.data.data);
};

export const deleteDepartment = async (id: string): Promise<void> => {
  await axiosClient.delete(`/departments/${id}`);
};