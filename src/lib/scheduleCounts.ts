import type { Schedule, ScheduleAssignment } from "../schemas/schedule";

export const getLogicalAssignmentCount = (assignments: ScheduleAssignment[] = []) => {
  const keys = new Set<string>();
  for (const assignment of assignments) {
    keys.add(assignment.examId);
  }
  return keys.size;
};

export const getScheduleAssignmentCount = (schedule?: Schedule | null) => {
  if (!schedule) return 0;
  if (typeof schedule.logicalAssignmentsCount === "number") {
    return schedule.logicalAssignmentsCount;
  }
  if (schedule.assignments) {
    return getLogicalAssignmentCount(schedule.assignments);
  }
  return 0;
};