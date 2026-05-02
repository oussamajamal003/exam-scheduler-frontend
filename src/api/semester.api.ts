import { axiosClient } from "./axiosclient";
import { CreateSemesterDto, Semester, UpdateSemesterDto } from "../schemas/semester";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type PaginatedResponse<T> = {
  data: T[];
  meta?: unknown;
};

type BackendSemester = {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  isCurrent?: boolean;
  academicYear?: string | null;
  status?: "ACTIVE" | "UPCOMING" | "PAST";
  courseOfferings?: unknown[];
  _count?: {
    courseOfferings?: number;
  };
};

const mapBackendSemester = (semester: BackendSemester): Semester => ({
  id: semester.id,
  name: semester.name,
  startDate: semester.startDate,
  endDate: semester.endDate,
  isActive: semester.isActive ?? false,
  isCurrent: semester.isCurrent ?? false,
  academicYear: semester.academicYear ?? undefined,
  status: semester.status,
  courseOfferings: semester.courseOfferings ?? [],
  courseOfferingsCount: semester.courseOfferings?.length ?? semester._count?.courseOfferings ?? 0,
});

const toIsoDateTime = (value: string): string => {
  if (!value) return value;
  const date = value.length <= 10 ? new Date(`${value}T00:00:00.000Z`) : new Date(value);
  return date.toISOString();
};

const serializeSemester = <T extends Partial<CreateSemesterDto>>(payload: T) => ({
  ...payload,
  ...(payload.startDate ? { startDate: toIsoDateTime(payload.startDate) } : {}),
  ...(payload.endDate ? { endDate: toIsoDateTime(payload.endDate) } : {}),
});

export const fetchSemesters = async (search = ""): Promise<Semester[]> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<BackendSemester>>>("/semesters", {
    params: { limit: 5000, search: search || undefined },
  });
  return (response.data?.data?.data ?? []).map(mapBackendSemester);
};

export const createSemester = async (data: CreateSemesterDto): Promise<Semester> => {
  const response = await axiosClient.post<ApiEnvelope<BackendSemester>>("/semesters", serializeSemester(data));
  if (!response.data?.data) throw new Error("Created semester not found in API response");
  return mapBackendSemester(response.data.data);
};

export const updateSemester = async ({ id, data }: { id: string; data: UpdateSemesterDto }): Promise<Semester> => {
  const response = await axiosClient.put<ApiEnvelope<BackendSemester>>(`/semesters/${id}`, serializeSemester(data));
  if (!response.data?.data) throw new Error("Updated semester not found in API response");
  return mapBackendSemester(response.data.data);
};

export const deleteSemester = async (id: string): Promise<void> => {
  await axiosClient.delete(`/semesters/${id}`);
};
