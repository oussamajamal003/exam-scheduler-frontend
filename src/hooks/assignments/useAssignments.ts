import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteAssignment,
  updateAssignment,
  type UpdateAssignmentDto,
} from "../../api/assignmentsApi";
import { scheduleKeys } from "../schedules/useSchedules";
import { useToast } from "../../components/ui/toast";
import { getSmartErrorDescription } from "../../lib/apiError";

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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.detail(variables.scheduleId),
      });
      addToast({
        type: "success",
        title: "Assignment Updated",
        description: "The assignment has been updated.",
      });
      addToast({
        type: "warning",
        title: "Schedule Changed",
        description:
          "Re-run conflict check before publishing this schedule.",
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
    }: {
      scheduleId: string;
      assignmentId: string;
    }) => deleteAssignment({ scheduleId, assignmentId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.detail(variables.scheduleId),
      });
      addToast({
        type: "success",
        title: "Assignment Deleted",
        description: "The assignment has been removed.",
      });
      addToast({
        type: "warning",
        title: "Schedule Changed",
        description:
          "Re-run conflict check before publishing this schedule.",
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
