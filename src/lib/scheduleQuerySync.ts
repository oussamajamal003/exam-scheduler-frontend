import type { QueryClient } from '@tanstack/react-query';

import { scheduleAssignmentKeys } from '@/hooks/assignments/useAssignments';
import { roleDashboardKeys } from '@/hooks/roleDashboards/useRoleDashboards';
import { roleNotificationKeys } from '@/hooks/roleNotifications/useRoleNotifications';
import { scheduleKeys } from '@/hooks/schedules/useSchedules';
import { studentNotificationKeys } from '@/hooks/studentNotifications/useStudentNotifications';

const dashboardKeys = {
  all: ['dashboard'] as const,
};

const globalSearchKeys = {
  all: ['global-search'] as const,
};

const semesterKeys = {
  all: ['semesters'] as const,
};

const courseOfferingKeys = {
  all: ['course-offerings'] as const,
  coursesForOfferings: ['courses', 'for-offerings'] as const,
};

const courseKeys = {
  all: ['courses'] as const,
  forOfferings: ['courses', 'for-offerings'] as const,
};

const departmentKeys = {
  all: ['departments'] as const,
};

const programKeys = {
  all: ['programs'] as const,
};

const enrollmentKeys = {
  all: ['enrollments'] as const,
};

const studentKeys = {
  all: ['students'] as const,
  exams: ['student-exams'] as const,
};

const proctorKeys = {
  all: ['proctors'] as const,
};

const roomKeys = {
  all: ['rooms'] as const,
};

const centerKeys = {
  all: ['centers'] as const,
};

const timeSlotKeys = {
  all: ['timeSlots'] as const,
};

type ScheduleSyncOptions = {
  includeSchedules?: boolean;
  includeAssignments?: boolean;
  includeDashboards?: boolean;
  includeNotifications?: boolean;
  includeSearch?: boolean;
  includeCourses?: boolean;
  includeDepartments?: boolean;
  includePrograms?: boolean;
  includeSemesters?: boolean;
  includeCourseOfferings?: boolean;
  includeEnrollments?: boolean;
  includeStudents?: boolean;
  includeProctors?: boolean;
  includeRooms?: boolean;
  includeCenters?: boolean;
  includeTimeSlots?: boolean;
};

const DEFAULT_SYNC_OPTIONS: Required<ScheduleSyncOptions> = {
  includeSchedules: true,
  includeAssignments: true,
  includeDashboards: true,
  includeNotifications: true,
  includeSearch: true,
  includeCourses: false,
  includeDepartments: false,
  includePrograms: false,
  includeSemesters: false,
  includeCourseOfferings: false,
  includeEnrollments: false,
  includeStudents: false,
  includeProctors: false,
  includeRooms: false,
  includeCenters: false,
  includeTimeSlots: false,
};

export const invalidateScheduleQuerySync = async (
  queryClient: QueryClient,
  options: ScheduleSyncOptions = {},
) => {
  const resolved = { ...DEFAULT_SYNC_OPTIONS, ...options };
  const invalidations: Promise<unknown>[] = [];

  if (resolved.includeSchedules) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: scheduleKeys.all }));
  }

  if (resolved.includeAssignments) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: scheduleAssignmentKeys.all }));
  }

  if (resolved.includeDashboards) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: dashboardKeys.all }));
    invalidations.push(queryClient.invalidateQueries({ queryKey: roleDashboardKeys.all }));
  }

  if (resolved.includeNotifications) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: roleNotificationKeys.all }));
    invalidations.push(queryClient.invalidateQueries({ queryKey: studentNotificationKeys.all }));
  }

  if (resolved.includeSearch) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: globalSearchKeys.all }));
  }

  if (resolved.includeCourses) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: courseKeys.all }));
    invalidations.push(queryClient.invalidateQueries({ queryKey: courseKeys.forOfferings }));
  }

  if (resolved.includeDepartments) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: departmentKeys.all }));
  }

  if (resolved.includePrograms) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: programKeys.all }));
  }

  if (resolved.includeSemesters) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: semesterKeys.all }));
  }

  if (resolved.includeCourseOfferings) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: courseOfferingKeys.all }));
    invalidations.push(queryClient.invalidateQueries({ queryKey: courseOfferingKeys.coursesForOfferings }));
  }

  if (resolved.includeEnrollments) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: enrollmentKeys.all }));
  }

  if (resolved.includeStudents) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: studentKeys.all }));
    invalidations.push(queryClient.invalidateQueries({ queryKey: studentKeys.exams }));
  }

  if (resolved.includeProctors) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: proctorKeys.all }));
  }

  if (resolved.includeRooms) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: roomKeys.all }));
  }

  if (resolved.includeCenters) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: centerKeys.all }));
  }

  if (resolved.includeTimeSlots) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: timeSlotKeys.all }));
  }

  await Promise.all(invalidations);
};