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
  optimizeScheduling,
  fetchScheduleAnalysis,
  generateSchedule,
  prepareScheduling,
  publishSchedule,
  validateSchedulingInput,
  type OptimizeSchedulingDto,
  type PrepareSchedulingDto,
  type PrepareSchedulingResult,
  type ValidateSchedulingInputDto,
  type ValidateSchedulingResult,
} from "../../api/schedulingApi";
import type { GenerateScheduleDto } from "../../schemas/schedule";
import { useToast } from "../../components/ui/toast";
import { getSmartErrorDescription } from "../../lib/apiError";
import { roleDashboardKeys } from "../roleDashboards/useRoleDashboards";
import { studentNotificationKeys } from "../studentNotifications/useStudentNotifications";

export const scheduleKeys = {
  all: ["schedules"] as const,
  list: (params: FetchSchedulesParams = {}) => ["schedules", "list", params] as const,
  detail: (id?: string) => ["schedules", "detail", id] as const,
  analysis: (id?: string) => ["schedules", "analysis", id] as const,
  assignments: (id?: string) => ["schedules", "assignments", id] as const,
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
    onSuccess: (schedule) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
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
    onSuccess: (schedule) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
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

export const useOptimizeScheduling = () => {
  const { addToast } = useToast();
  return useMutation<ValidateSchedulingResult, unknown, OptimizeSchedulingDto | undefined>({
    mutationFn: (payload: OptimizeSchedulingDto = {}) => optimizeScheduling(payload),
    onSuccess: (result) => {
      addToast({
        type: result.isValid ? "success" : "warning",
        title: result.isValid ? "Optimization Confirmed" : "Optimization Blocked",
        description:
          result.optimization?.message ??
          (result.isValid
            ? "The hybrid engine found a complete valid draft."
            : "Hard-constraint requirements remain unsatisfied after optimization."),
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Optimization Failed",
        description: getSmartErrorDescription(
          error,
          "An error occurred while optimizing the scheduling draft."
        ),
      });
    },
  });
};


export const useGenerateSchedule = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (payload: GenerateScheduleDto) => generateSchedule(payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      addToast({
        type: "success",
        title: "Schedule Generated",
        description: result?.message ?? "Schedule generated successfully with all hard constraints satisfied.",
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
    onSuccess: (schedule) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      queryClient.invalidateQueries({ queryKey: roleDashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: studentNotificationKeys.all });
      addToast({
        type: "success",
        title: "Schedule Published",
        description: `${schedule.name} is now final.`,
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
    onSuccess: (schedule) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      addToast({
        type: "success",
        title: "Returned to Draft",
        description: `${schedule.name} is now editable.`,
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
