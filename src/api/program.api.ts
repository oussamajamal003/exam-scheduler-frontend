import { axiosClient } from './axiosclient';
import { CreateProgramDto, Program, UpdateProgramDto } from '@/schemas/program';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type ProgramRecord = {
  id: string;
  name: string;
  code: string;
  createdAt?: string;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  courses?: Array<{
    id?: string;
  }>;
  isActive?: boolean;
  _count?: {
    courses?: number;
  };
};

type PaginatedResponse<T> = {
  data: T[];
  meta?: unknown;
};

type PageMeta = {
  totalPages: number;
};

const PROGRAM_LIST_PAGE_SIZE = 200;

export type ProgramPageMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PagedPrograms = {
  data: Program[];
  meta: ProgramPageMeta;
};

const mapBackendProgram = (program: ProgramRecord): Program => ({
  id: program.id,
  name: program.name,
  code: program.code,
  departmentId: program.departmentId ?? program.department?.id ?? '',
  department: program.department
    ? {
        id: program.department.id,
        name: program.department.name,
        code: program.department.code,
      }
    : null,
  courses: program.courses ?? [],
  departmentName: program.department?.name ?? 'Unassigned Department',
  totalCourses: program.courses?.length ?? program._count?.courses ?? 0,
  createdAt: program.createdAt,
  isActive: program.isActive ?? true,
});

const readPageMeta = (meta: unknown): PageMeta => {
  const raw = (meta && typeof meta === 'object' ? meta : {}) as Record<string, unknown>;
  const totalPages = Number(raw.totalPages ?? 1) || 1;
  return { totalPages };
};

export const fetchPrograms = async (search = ''): Promise<Program[]> => {
  const programs: Program[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<ProgramRecord>>>('/programs', {
      params: {
        page,
        pageSize: PROGRAM_LIST_PAGE_SIZE,
        search: search || undefined,
      },
    });

    const payload = response.data?.data;
    programs.push(...(payload?.data ?? []).map(mapBackendProgram));
    totalPages = readPageMeta(payload?.meta).totalPages;
    page += 1;
  } while (page <= totalPages);

  return programs;
};

export const fetchProgramsPage = async ({
  page = 1,
  pageSize = 50,
  search = '',
  departmentId,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: string;
} = {}): Promise<PagedPrograms> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<ProgramRecord>>>('/programs', {
    params: {
      page,
      pageSize,
      search: search || undefined,
      departmentId: departmentId || undefined,
    },
  });
  const payload = response.data?.data;
  const meta = readPageMeta(payload?.meta);
  const raw = (payload?.meta && typeof payload.meta === 'object' ? payload.meta : {}) as Record<string, unknown>;
  const total = Number(raw.total ?? 0) || 0;
  return {
    data: (payload?.data ?? []).map(mapBackendProgram),
    meta: { total, page: Number(raw.page ?? page) || page, pageSize: Number(raw.limit ?? raw.pageSize ?? pageSize) || pageSize, totalPages: meta.totalPages },
  };
};

export const createProgram = async (program: CreateProgramDto): Promise<Program> => {
  const payload = {
    name: program.name,
    code: program.code,
    departmentId: program.departmentId,
    isActive: true,
  };

  const response = await axiosClient.post<ApiEnvelope<ProgramRecord>>('/programs', payload);
  if (!response.data?.data) throw new Error('Created program not found in API response');
  return mapBackendProgram(response.data.data);
};

export const updateProgram = async ({ id, data }: { id: string; data: UpdateProgramDto }): Promise<Program> => {
  const response = await axiosClient.put<ApiEnvelope<ProgramRecord>>(`/programs/${id}`, data);
  if (!response.data?.data) throw new Error('Updated program not found in API response');
  return mapBackendProgram(response.data.data);
};

export const deleteProgram = async (id: string): Promise<void> => {
  await axiosClient.delete(`/programs/${id}`);
};