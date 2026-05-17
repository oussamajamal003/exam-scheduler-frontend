import React from 'react';

import { useStudents } from '@/hooks/students/useStudents';
import { useCourses } from '@/hooks/courses/useCourses';
import { useRooms } from '@/hooks/rooms/useRooms';
import { useProctors } from '@/hooks/proctors/useProctors';
import { useExams } from '@/hooks/exams/useExams';
import { useSemesters } from '@/hooks/semesters/useSemesters';
import { useSchedules } from '@/hooks/schedules/useSchedules';

import type { Schedule } from '@/schemas/schedule';
import type { Semester } from '@/schemas/semester';

export interface DashboardSummaryCounts {
  totalStudents: number;
  totalCourses: number;
  totalRooms: number;
  totalProctors: number;
  totalExams: number;
  totalSemesters: number;
  totalSchedules: number;
  publishedAssignments: number;
  activeExamPeriods: number;
}

export interface DashboardSummary {
  counts: DashboardSummaryCounts;
  schedules: Schedule[];
  sortedSchedules: Schedule[];
  latestSchedule: Schedule | undefined;
  activeSemester: Semester | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  errors: Array<unknown>;
  refetch: () => Promise<void>;
}

const len = (value: unknown): number => (Array.isArray(value) ? value.length : 0);

export const useDashboardSummary = (): DashboardSummary => {
  const studentsQ = useStudents();
  const coursesQ = useCourses();
  const roomsQ = useRooms();
  const proctorsQ = useProctors();
  const examsQ = useExams();
  const semestersQ = useSemesters();
  const schedulesQ = useSchedules({ limit: 50 });

  const schedules = React.useMemo<Schedule[]>(
    () => schedulesQ.data?.data ?? [],
    [schedulesQ.data]
  );

  const sortedSchedules = React.useMemo(
    () =>
      [...schedules].sort(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.updatedAt ?? a.createdAt).getTime()
      ),
    [schedules]
  );

  const semesters = React.useMemo(() => semestersQ.data ?? [], [semestersQ.data]);
  const activeSemester = React.useMemo(() => {
    if (!semesters.length) return undefined;
    return [...semesters].sort((a, b) => {
      const ta = a.startDate ? new Date(a.startDate).getTime() : 0;
      const tb = b.startDate ? new Date(b.startDate).getTime() : 0;
      return tb - ta;
    })[0];
  }, [semesters]);

  const publishedAssignments = sortedSchedules
    .filter((schedule) => schedule.isFinal)
    .reduce((acc, schedule) => acc + (schedule._count?.assignments ?? 0), 0);

  const activeExamPeriods = sortedSchedules.filter((schedule) => schedule.isFinal).length;

  const counts: DashboardSummaryCounts = {
    totalStudents: len(studentsQ.data),
    totalCourses: len(coursesQ.data),
    totalRooms: len(roomsQ.data),
    totalProctors: len(proctorsQ.data),
    totalExams: len(examsQ.data),
    totalSemesters: semesters.length,
    totalSchedules: schedules.length,
    publishedAssignments,
    activeExamPeriods,
  };

  const queries = [
    studentsQ,
    coursesQ,
    roomsQ,
    proctorsQ,
    examsQ,
    semestersQ,
    schedulesQ,
  ];

  return {
    counts,
    schedules,
    sortedSchedules,
    latestSchedule: sortedSchedules[0],
    activeSemester,
    isLoading: queries.some((query) => query.isLoading),
    isFetching: queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError),
    errors: queries.map((query) => query.error).filter(Boolean),
    refetch: async () => {
      await Promise.all(queries.map((query) => query.refetch()));
    },
  };
};
