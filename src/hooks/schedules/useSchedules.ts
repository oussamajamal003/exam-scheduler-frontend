import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSchedule,
  deleteSchedule,
  fetchSchedule,
  fetchSchedules,
  updateSchedule,
  unpublishSchedule,
  type CreateScheduleDto,
  type FetchSchedulesParams,
  type UpdateScheduleDto,
} from "../../api/schedulesApi";
import {
  fetchScheduleAnalysis,
  generateSchedule,
  prepareScheduling,
  publishSchedule,
  validateSchedulingInput,
  type PrepareSchedulingDto,
  type PrepareSchedulingResult,
  type ValidateSchedulingInputDto,
  type ValidateSchedulingResult,
} from "../../api/schedulingApi";
import type { GenerateScheduleDto } from "../../schemas/schedule";
import { useToast } from "../../components/ui/toast";
import { getSmartErrorDescription } from "../../lib/apiError";
import { invalidateScheduleQuerySync } from "../../lib/scheduleQuerySync";

export const scheduleKeys = {
  all: ["schedules"] as const,
  lists: ["schedules", "list"] as const,
  details: ["schedules", "detail"] as const,
  analyses: ["schedules", "analysis"] as const,
  assignmentLists: ["schedules", "assignments"] as const,
  list: (params: FetchSchedulesParams = {}) => ["schedules", "list", params] as const,
  detail: (id?: string) => ["schedules", "detail", id] as const,
  analysis: (id?: string) => ["schedules", "analysis", id] as const,
  assignments: (id?: string) => ["schedules", "assignments", id] as const,
  assignmentsPage: (id?: string) => ["schedules", "assignments", id, "page"] as const,
};

// -------------------- Queries --------------------

export const useSchedules = (params: FetchSchedulesParams = {}) =>
  useQuery({
    queryKey: scheduleKeys.list(params),
    queryFn: () => fetchSchedules(params),
  });

export const useSchedule = (id?: string) =>
  useQuery({
    queryKey: scheduleKeys.detail(id),
    queryFn: () => fetchSchedule(id as string),
    enabled: Boolean(id),
  });

export const useScheduleAnalysis = (id?: string) =>
  useQuery({
    queryKey: scheduleKeys.analysis(id),
    queryFn: () => fetchScheduleAnalysis(id as string),
    enabled: Boolean(id),
  });

// -------------------- Mutations: CRUD --------------------

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateScheduleDto) => createSchedule(data),
    onSuccess: async (schedule) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeAssignments: false,
        includeNotifications: false,
      });
      queryClient.setQueryData(scheduleKeys.detail(schedule.id), schedule);
      addToast({
        type: "success",
        title: "Schedule Created",
        description: `${schedule.name} has been created.`,
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Create Schedule",
        description: getSmartErrorDescription(
          error,
          "An error occurred while creating the schedule."
        ),
      });
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduleDto }) =>
      updateSchedule({ id, data }),
    onSuccess: async (schedule) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeAssignments: true,
        includeDashboards: true,
        includeNotifications: false,
        includeSearch: true,
      });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(schedule.id) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.analysis(schedule.id) });
      addToast({
        type: "success",
        title: "Schedule Updated",
        description: `${schedule.name} has been updated.`,
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Update Schedule",
        description: getSmartErrorDescription(
          error,
          "An error occurred while updating the schedule."
        ),
      });
    },
  });
};

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: async (_data, id) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeAssignments: true,
        includeNotifications: false,
      });
      queryClient.removeQueries({ queryKey: scheduleKeys.detail(id) });
      queryClient.removeQueries({ queryKey: scheduleKeys.analysis(id) });
      queryClient.removeQueries({ queryKey: scheduleKeys.assignments(id) });
      addToast({
        type: "success",
        title: "Schedule Deleted",
        description: "The schedule has been removed.",
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Delete Schedule",
        description: getSmartErrorDescription(
          error,
          "An error occurred while deleting the schedule."
        ),
      });
    },
  });
};

// -------------------- Mutations: Pipeline --------------------

export const usePrepareScheduling = () => {
  const { addToast } = useToast();
  return useMutation<PrepareSchedulingResult, unknown, PrepareSchedulingDto | undefined>({
    mutationFn: (payload: PrepareSchedulingDto = {}) => prepareScheduling(payload),
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Prepare Scheduling",
        description: getSmartErrorDescription(
          error,
          "An error occurred while preparing scheduling."
        ),
      });
    },
  });
};

export const useValidateSchedulingInput = () => {
  const { addToast } = useToast();
  return useMutation<ValidateSchedulingResult, unknown, ValidateSchedulingInputDto | undefined>({
    mutationFn: (payload: ValidateSchedulingInputDto = {}) =>
      validateSchedulingInput(payload),
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Validation Failed",
        description: getSmartErrorDescription(
          error,
          "An error occurred while validating scheduling input."
        ),
      });
    },
  });
};


export const useGenerateSchedule = () => {
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (payload: GenerateScheduleDto) => generateSchedule(payload),
    onSuccess: (result) => {
      // Do NOT invalidate the schedule list here. The GenerateScheduleDialog
      // calls onGenerated() → handleGenerated() which immediately calls
      // schedulesQuery.refetch() on dialog close, so the new row appears as
      // soon as the close animation completes.
      addToast({
        type: "success",
        title: "Schedule Generated",
        description: result?.message ?? "Draft schedule generated successfully with all internal hard constraints satisfied.",
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Generate Schedule",
        description: getSmartErrorDescription(
          error,
          "An error occurred while generating the schedule."
        ),
      });
    },
  });
};

export const usePublishSchedule = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, examPeriod }: { id: string; examPeriod: string }) =>
      publishSchedule(id, { examPeriod }),
    onSuccess: async (result) => {
      await invalidateScheduleQuerySync(queryClient);
      queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(result.schedule.id) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.analysis(result.schedule.id) });
      const isRepublish = result?.eventType === "SCHEDULE_REPUBLISHED";
      addToast({
        type: "success",
        title: isRepublish ? "Schedule Republished" : "Schedule Published",
        description: `${result.schedule.name} is now final.`,
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Publish Schedule",
        description: getSmartErrorDescription(
          error,
          "An error occurred while publishing the schedule."
        ),
      });
    },
  });
};

export const useUnpublishSchedule = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => unpublishSchedule(id),
    onSuccess: async (schedule) => {
      await invalidateScheduleQuerySync(queryClient);
      queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(schedule.id) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.analysis(schedule.id) });
      addToast({
        type: "success",
        title: "Schedule Unpublished",
        description: `${schedule.name} has been returned to draft.`,
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Return to Draft",
        description: getSmartErrorDescription(
          error,
          "An error occurred while returning the schedule to draft."
        ),
      });
    },
  });
};
