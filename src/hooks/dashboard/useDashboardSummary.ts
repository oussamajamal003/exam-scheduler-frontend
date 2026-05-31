import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { axiosClient } from '@/api/axiosclient';
import { useSemesters } from '@/hooks/semesters/useSemesters';
import { useSchedules } from '@/hooks/schedules/useSchedules';
import { getScheduleAssignmentCount } from '@/lib/scheduleCounts';

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

type ApiEnvelope<T> = { success?: boolean; message?: string; data?: T };

type AdminCounts = {
  students: number;
  courses: number;
  rooms: number;
  proctors: number;
  exams: number;
  semesters: number;
  schedules: number;
  publishedAssignments: number;
};

const fetchAdminCounts = async (): Promise<AdminCounts> => {
  const res = await axiosClient.get<ApiEnvelope<AdminCounts>>('/role-dashboards/admin/counts');
  const data = res.data?.data;
  if (!data) throw new Error('Admin counts response missing data');
  return data;
};

export const useDashboardSummary = (): DashboardSummary => {
  // Single endpoint replaces 5 separate entity-count requests.
  const countsQ = useQuery({
    queryKey: ['dashboard', 'admin-counts'],
    queryFn: fetchAdminCounts,
    staleTime: 60_000, // counts can be slightly stale (1 min)
  });

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
    return semesters.find(s => s.isActive) ?? undefined;
  }, [semesters]);

  const publishedAssignments = sortedSchedules
    .filter((schedule) => schedule.isFinal)
    .reduce((acc, schedule) => acc + getScheduleAssignmentCount(schedule), 0);

  const activeExamPeriods = sortedSchedules.filter((schedule) => schedule.isFinal).length;

  const counts: DashboardSummaryCounts = {
    totalStudents: countsQ.data?.students ?? 0,
    totalCourses: countsQ.data?.courses ?? 0,
    totalRooms: countsQ.data?.rooms ?? 0,
    totalProctors: countsQ.data?.proctors ?? 0,
    totalExams: countsQ.data?.exams ?? 0,
    totalSemesters: countsQ.data?.semesters ?? semesters.length,
    totalSchedules: countsQ.data?.schedules ?? schedules.length,
    publishedAssignments,
    activeExamPeriods,
  };

  const queries = [countsQ, semestersQ, schedulesQ];

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
