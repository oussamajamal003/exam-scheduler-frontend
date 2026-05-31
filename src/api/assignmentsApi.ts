import { axiosClient } from "./axiosclient";
import type { ScheduleAssignment } from "../schemas/schedule";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

const unwrap = <T,>(payload: ApiEnvelope<T> | undefined, label: string): T => {
  if (!payload?.data) throw new Error(`${label} response missing data`);
  return payload.data;
};

export type UpdateAssignmentDto = {
  assignmentIds?: string[];
  roomId?: string;
  proctorId?: string;
  proctorIds?: string[];
  timeSlotId?: string;
  exam?: {
    duration?: number;
    status?: "DRAFT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  };
};

export type AssignmentListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  status?: string;
  phase?: string;
  roomId?: string;
  proctorId?: string;
  timeSlotId?: string;
  courseId?: string;
  semesterId?: string;
  centerId?: string;
  examDate?: string;
  startDate?: string;
  endDate?: string;
};

export type AssignmentPaginatedMeta = {
  total: number;
  totalCount: number;
  logicalTotal: number;
  page: number;
  limit: number;
  pageSize: number;
  totalPages: number;
};

export type PagedAssignments = {
  data: ScheduleAssignment[];
  meta: AssignmentPaginatedMeta;
};

const base = (scheduleId: string) =>
  `/schedules/${scheduleId}/assignments`;

// GET /api/schedules/:scheduleId/assignments (paginated)
export const fetchScheduleAssignments = async (
  scheduleId: string
): Promise<ScheduleAssignment[]> => {
  const response = await axiosClient.get<ApiEnvelope<unknown>>(base(scheduleId));
  const raw = response.data?.data;
  if (Array.isArray(raw)) return raw as ScheduleAssignment[];
  return (raw as { data?: ScheduleAssignment[] })?.data ?? [];
};

// GET /api/schedules/:scheduleId/assignments (paginated, with params)
export const fetchAssignmentsPage = async (
  scheduleId: string,
  params: AssignmentListParams = {}
): Promise<PagedAssignments> => {
  const response = await axiosClient.get<
    ApiEnvelope<{ data: ScheduleAssignment[]; meta: unknown }>
  >(base(scheduleId), {
    params: { ...params, search: params.search?.trim() || undefined },
  });
  const payload = response.data?.data;
  const m = (payload?.meta ?? {}) as Record<string, number>;
  const pg = params.page ?? 1;
  const ps = params.pageSize ?? 100;
  return {
    data: payload?.data ?? [],
    meta: {
      total: m.total ?? m.totalCount ?? 0,
      totalCount: m.total ?? m.totalCount ?? 0,
      logicalTotal: m.logicalTotal ?? m.logicalTotalCount ?? m.total ?? m.totalCount ?? 0,
      page: m.page ?? pg,
      limit: m.limit ?? m.pageSize ?? ps,
      pageSize: m.pageSize ?? m.limit ?? ps,
      totalPages: m.totalPages ?? 1,
    },
  };
};

// GET /api/schedules/:scheduleId/assignments/:assignmentId
export const fetchAssignment = async (
  scheduleId: string,
  assignmentId: string
): Promise<ScheduleAssignment> => {
  const response = await axiosClient.get<ApiEnvelope<ScheduleAssignment>>(
    `${base(scheduleId)}/${assignmentId}`
  );
  return unwrap(response.data, "Assignment");
};

// PUT /api/schedules/:scheduleId/assignments/:assignmentId
export const updateAssignment = async ({
  scheduleId,
  assignmentId,
  data,
}: {
  scheduleId: string;
  assignmentId: string;
  data: UpdateAssignmentDto;
}): Promise<ScheduleAssignment> => {
  const response = await axiosClient.put<ApiEnvelope<ScheduleAssignment>>(
    `${base(scheduleId)}/${assignmentId}`,
    data
  );
  return unwrap(response.data, "Update assignment");
};

// DELETE /api/schedules/:scheduleId/assignments/:assignmentId
export const deleteAssignment = async ({
  scheduleId,
  assignmentId,
  deleteGroup,
}: {
  scheduleId: string;
  assignmentId: string;
  deleteGroup?: boolean;
}): Promise<void> => {
  await axiosClient.delete(`${base(scheduleId)}/${assignmentId}`, {
    params: deleteGroup ? { deleteGroup: true } : undefined,
  });
};
