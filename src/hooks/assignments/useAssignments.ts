import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAssignment,
  fetchAssignmentsPage,
  fetchScheduleAssignments,
  updateAssignment,
  type AssignmentListParams,
  type UpdateAssignmentDto,
} from "../../api/assignmentsApi";
import { scheduleKeys } from "../schedules/useSchedules";
import { useToast } from "../../components/ui/toast";
import { getSmartErrorDescription } from "../../lib/apiError";
import { invalidateScheduleQuerySync } from "../../lib/scheduleQuerySync";

export const scheduleAssignmentKeys = {
  all: ["schedule-assignments"] as const,
  schedule: (scheduleId?: string) => ["schedule-assignments", scheduleId] as const,
  page: (
    scheduleId: string | undefined,
    page: number,
    search: string,
    filters: Record<string, string | null>,
    sort: { field: string | null; direction: "asc" | "desc" }
  ) => ["schedule-assignments", scheduleId, page, search, filters, sort] as const,
};

export const useScheduleAssignments = (scheduleId?: string) =>
  useQuery({
    queryKey: scheduleKeys.assignments(scheduleId),
    queryFn: () => fetchScheduleAssignments(scheduleId as string),
    enabled: Boolean(scheduleId),
  });

export const useAssignmentsPage = ({
  scheduleId,
  page = 1,
  pageSize = 100,
  search = "",
  sortField,
  sortDirection,
  status,
  phase,
  roomId,
  proctorId,
  timeSlotId,
  courseId,
  semesterId,
  centerId,
  examDate,
  startDate,
  endDate,
  enabled = true,
}: AssignmentListParams & { scheduleId?: string; enabled?: boolean } = {}) =>
  useQuery({
    queryKey: scheduleAssignmentKeys.page(
      scheduleId,
      page,
      search,
      {
        pageSize: String(pageSize),
        status: status ?? null,
        phase: phase ?? null,
        roomId: roomId ?? null,
        proctorId: proctorId ?? null,
        timeSlotId: timeSlotId ?? null,
        courseId: courseId ?? null,
        semesterId: semesterId ?? null,
        centerId: centerId ?? null,
        examDate: examDate ?? null,
        startDate: startDate ?? null,
        endDate: endDate ?? null,
      },
      { field: sortField ?? null, direction: sortDirection ?? "asc" }
    ),
    queryFn: () =>
      fetchAssignmentsPage(scheduleId as string, {
        page,
        pageSize,
        search,
        sortField,
        sortDirection,
        status,
        phase,
        roomId,
        proctorId,
        timeSlotId,
        courseId,
        semesterId,
        centerId,
        examDate,
        startDate,
        endDate,
      }),
    enabled: Boolean(scheduleId) && enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({
      scheduleId,
      assignmentId,
      data,
    }: {
      scheduleId: string;
      assignmentId: string;
      data: UpdateAssignmentDto;
    }) => updateAssignment({ scheduleId, assignmentId, data }),
    onSuccess: async (_data, variables) => {
      await invalidateScheduleQuerySync(queryClient);
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.detail(variables.scheduleId),
      });
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.analysis(variables.scheduleId),
      });
      queryClient.invalidateQueries({ queryKey: scheduleAssignmentKeys.schedule(variables.scheduleId) });
      addToast({
        type: "success",
        title: "Assignment updated successfully",
        description: "Schedule updated successfully.",
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Update Assignment",
        description: getSmartErrorDescription(
          error,
          "An error occurred while updating the assignment."
        ),
      });
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({
      scheduleId,
      assignmentId,
      deleteGroup,
    }: {
      scheduleId: string;
      assignmentId: string;
      deleteGroup?: boolean;
    }) => deleteAssignment({ scheduleId, assignmentId, deleteGroup }),
    onSuccess: async (_data, variables) => {
      await invalidateScheduleQuerySync(queryClient);
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.detail(variables.scheduleId),
      });
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.analysis(variables.scheduleId),
      });
      queryClient.invalidateQueries({ queryKey: scheduleAssignmentKeys.schedule(variables.scheduleId) });
      addToast({
        type: "success",
        title: "Assignment Deleted",
        description: "The assignment has been removed.",
      });
      addToast({
        type: "warning",
        title: "Schedule Changed",
        description: "Review the updated published schedule.",
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Delete Assignment",
        description: getSmartErrorDescription(
          error,
          "An error occurred while deleting the assignment."
        ),
      });
    },
  });
};
