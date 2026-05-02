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

export const fetchPrograms = async (search = ''): Promise<Program[]> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<ProgramRecord>>>('/programs', {
    params: { limit: 5000, search: search || undefined },
  });

  return (response.data?.data?.data ?? []).map(mapBackendProgram);
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