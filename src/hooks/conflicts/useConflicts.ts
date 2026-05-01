import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  detectConflicts,
  fetchConflict,
  fetchConflicts,
  type FetchConflictsParams,
} from "../../api/conflictsApi";
import type { DetectConflictsDto } from "../../schemas/conflict";
import { useToast } from "../../components/ui/toast";
import { getSmartErrorDescription } from "../../lib/apiError";
import { scheduleKeys } from "../schedules/useSchedules";

export const conflictKeys = {
  all: ["conflicts"] as const,
  list: (params: FetchConflictsParams = {}) => ["conflicts", "list", params] as const,
  detail: (id?: string) => ["conflicts", "detail", id] as const,
};

export const useConflicts = (params: FetchConflictsParams = {}) =>
  useQuery({
    queryKey: conflictKeys.list(params),
    queryFn: () => fetchConflicts(params),
  });

export const useConflict = (id?: string) =>
  useQuery({
    queryKey: conflictKeys.detail(id),
    queryFn: () => fetchConflict(id as string),
    enabled: Boolean(id),
  });

export const useDetectConflicts = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (payload: DetectConflictsDto) => detectConflicts(payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: conflictKeys.all });
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.conflicts(result.scheduleId),
      });
      addToast({
        type: "success",
        title: "Conflict Detection Complete",
        description: `${result.detectedCount} conflict(s) detected.`,
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Detect Conflicts",
        description: getSmartErrorDescription(
          error,
          "An error occurred while detecting conflicts."
        ),
      });
    },
  });
};
