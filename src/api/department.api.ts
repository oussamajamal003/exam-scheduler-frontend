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
  programs?: unknown[];
  courses?: unknown[];
  totalCourses?: number;
  programsCount?: number;
  _count?: {
    programs?: number;
  };
};

type PaginatedResponse<T> = {
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    pageSize?: number;
    totalPages?: number;
  };
};

const DEPARTMENTS_PAGE_SIZE = 200;

export type DepartmentPageMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PagedDepartments = {
  data: Department[];
  meta: DepartmentPageMeta;
};

const mapBackendDepartment = (department: DepartmentRecord): Department => ({
  id: department.id,
  name: department.name,
  code: department.code,
  createdAt: department.createdAt,
  programs: department.programs ?? [],
  courses: department.courses ?? [],
  programsCount: department.programs?.length ?? department.programsCount ?? department._count?.programs ?? 0,
  totalCourses: department.courses?.length ?? department.totalCourses ?? 0,
});

export const fetchDepartments = async (search = ''): Promise<Department[]> => {
  const departments: DepartmentRecord[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<DepartmentRecord>>>('/departments', {
      params: {
        page,
        pageSize: DEPARTMENTS_PAGE_SIZE,
        search: search || undefined,
      },
    });

    const payload = response.data?.data;
    const pageItems = payload?.data ?? [];
    departments.push(...pageItems);
    totalPages = Math.max(payload?.meta?.totalPages ?? 1, 1);
    page += 1;
  } while (page <= totalPages);

  return departments.map(mapBackendDepartment);
};

export const fetchDepartmentsPage = async ({
  page = 1,
  pageSize = 50,
  search = '',
}: {
  page?: number;
  pageSize?: number;
  search?: string;
} = {}): Promise<PagedDepartments> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<DepartmentRecord>>>('/departments', {
    params: {
      page,
      pageSize,
      search: search || undefined,
    },
  });
  const payload = response.data?.data;
  const meta = payload?.meta ?? {};
  const total = Number(meta.total ?? 0) || 0;
  const totalPages = Number(meta.totalPages ?? Math.ceil(total / Math.max(pageSize, 1))) || 1;
  return {
    data: (payload?.data ?? []).map(mapBackendDepartment),
    meta: { total, page: Number(meta.page ?? page) || page, pageSize: Number(meta.limit ?? meta.pageSize ?? pageSize) || pageSize, totalPages },
  };
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