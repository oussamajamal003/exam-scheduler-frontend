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
  roomId?: string;
  proctorId?: string;
  timeSlotId?: string;
  exam?: {
    duration?: number;
    status?: "DRAFT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  };
};

const base = (scheduleId: string) =>
  `/schedules/${scheduleId}/assignments`;

// GET /api/schedules/:scheduleId/assignments
export const fetchScheduleAssignments = async (
  scheduleId: string
): Promise<ScheduleAssignment[]> => {
  const response = await axiosClient.get<ApiEnvelope<ScheduleAssignment[]>>(
    base(scheduleId)
  );
  return unwrap(response.data, "Schedule assignments");
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
