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

export type SemesterPageMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PagedSemesters = {
  data: Semester[];
  meta: SemesterPageMeta;
};

const SEMESTER_LIST_PAGE_SIZE = 200;

type BackendSemester = {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  academicYear?: string | null;
  isActive?: boolean;
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
  academicYear: semester.academicYear ?? undefined,
  isActive: semester.isActive ?? false,
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
  const semesters: Semester[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<BackendSemester>>>("/semesters", {
      params: {
        page,
        pageSize: SEMESTER_LIST_PAGE_SIZE,
        search: search || undefined,
      },
    });

    const payload = response.data?.data;
    const chunk = (payload?.data ?? []).map(mapBackendSemester);
    semesters.push(...chunk);

    const meta = readSemesterMeta(payload?.meta, page, SEMESTER_LIST_PAGE_SIZE);
    totalPages = meta.totalPages;
    page += 1;
  } while (page <= totalPages);

  return semesters;
};

const readSemesterMeta = (meta: unknown, fallbackPage: number, fallbackSize: number): SemesterPageMeta => {
  const raw = (meta && typeof meta === "object" ? meta : {}) as Record<string, unknown>;
  const total = Number(raw.total ?? 0) || 0;
  const page = Number(raw.page ?? fallbackPage) || fallbackPage;
  const limit = Number(raw.limit ?? raw.pageSize ?? fallbackSize) || fallbackSize;
  const totalPages = Number(raw.totalPages ?? Math.ceil(total / Math.max(limit, 1))) || 1;
  return { total, page, pageSize: limit, totalPages };
};

export const fetchSemestersPage = async ({
  page = 1,
  pageSize = 50,
  search = "",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
} = {}): Promise<PagedSemesters> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<BackendSemester>>>("/semesters", {
    params: {
      page,
      pageSize,
      search: search || undefined,
    },
  });
  const payload = response.data?.data;
  return {
    data: (payload?.data ?? []).map(mapBackendSemester),
    meta: readSemesterMeta(payload?.meta, page, pageSize),
  };
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
