import React from 'react';

import { useSchedule, useScheduleAnalysis } from '@/hooks/schedules/useSchedules';
import { useScheduleAssignments } from '@/hooks/assignments/useAssignments';

import type { Schedule, ScheduleAssignment } from '@/schemas/schedule';
import type { WeakArea } from '@/components/dashboard/WeakAreasPanel';
import type { ChartDatum } from '@/components/dashboard/RealBarChart';

const QUALITY_KEYS = [
  'roomUtilization',
  'proctorWorkloadBalance',
  'studentSpacing',
  'examDistribution',
] as const;
type QualityKey = (typeof QUALITY_KEYS)[number];

export type QualityMetrics = Record<QualityKey, number | null>;

export interface OptimizationSnapshot {
  before: number | null;
  after: number | null;
  improvement: number | null;
  strategy: string | null;
  attempted: boolean;
}

export type DashboardStatusTone = 'success' | 'warning' | 'info' | 'neutral';

export interface DashboardScheduleStatus {
  tone: DashboardStatusTone;
  label: string;
  description: string;
  statusLabel: string;
}

export interface DashboardCharts {
  byRoom: ChartDatum[];
  byProctor: ChartDatum[];
  byDay: ChartDatum[];
  byCenter: ChartDatum[];
  qualityMetricBars: ChartDatum[];
}

export interface DashboardAnalyticsResult {
  scheduleId: string | undefined;
  selectedSchedule: Schedule | undefined;
  selectedDetailed: Schedule | undefined;
  assignments: ScheduleAssignment[];
  qualityMetrics: QualityMetrics;
  optimization: OptimizationSnapshot;
  weakAreas: WeakArea[];
  charts: DashboardCharts;
  qualityScores: {
    qualityScore: number | null | undefined;
    hardConstraintScore: number | null | undefined;
    softConstraintScore: number | null | undefined;
    draftScore: number | null;
    optimizedScore: number | null;
    improvementScore: number | null;
  };
  totalConflicts: number | null;
  status: DashboardScheduleStatus;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
}

// ---------- helpers ----------
const isObj = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const scorePct = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) return null;
  return value <= 1.0001 ? Math.round(value * 100) : Math.round(value);
};

const roundMetric = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const getPathValue = (source: unknown, path: string[]) => {
  let cursor: unknown = source;
  for (const key of path) {
    if (!isObj(cursor)) return undefined;
    cursor = cursor[key];
  }
  return cursor;
};

const firstNumber = (source: unknown, paths: string[][]) => {
  for (const path of paths) {
    const value = getPathValue(source, path);
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
};

const metricLabel = (key: string) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());

const topN = (items: ChartDatum[], n = 8): ChartDatum[] =>
  [...items].sort((a, b) => b.value - a.value).slice(0, n);

const groupCount = <T,>(
  arr: T[],
  key: (item: T) => string | undefined | null
): ChartDatum[] => {
  const counts = new Map<string, number>();
  for (const item of arr) {
    const k = key(item);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return Array.from(counts, ([name, value]) => ({ name, value }));
};

const getAssignmentStudentIds = (assignment: ScheduleAssignment) => {
  const registrations = assignment.exam?.courseOffering?.registrations ?? [];
  return registrations.map((registration) => registration.studentId).filter(Boolean);
};

const deriveAssignmentQualityMetrics = (assignments: ScheduleAssignment[]): QualityMetrics => {
  const examSlotGroups = new Map<string, ScheduleAssignment[]>();
  for (const assignment of assignments) {
    const key = `${assignment.examId}:${assignment.timeSlotId}`;
    const group = examSlotGroups.get(key) ?? [];
    group.push(assignment);
    examSlotGroups.set(key, group);
  }

  let totalUsedSeats = 0;
  let totalAvailableSeats = 0;
  const proctorWorkloads = new Map<string, number>();
  const studentSlotEntries = new Map<string, Array<{ startTime: number; endTime: number }>>();
  const dayExamCounts = new Map<string, number>();

  for (const group of examSlotGroups.values()) {
    const first = group[0];
    const registrationsCount = first.exam?.courseOffering?.registrations?.length;
    const expectedStudents = first.exam?.courseOffering?.expectedStudents;
    const requiredSeats = registrationsCount ?? expectedStudents ?? 0;
    const uniqueRooms = new Map(group.map((assignment) => [assignment.roomId, assignment.room]));
    const capacity = Array.from(uniqueRooms.values()).reduce(
      (sum, room) => sum + (room?.capacity ?? 0),
      0
    );
    totalUsedSeats += Math.min(requiredSeats, capacity);
    totalAvailableSeats += capacity;

    const uniqueProctors = new Set(group.map((assignment) => assignment.proctorId).filter(Boolean));
    for (const proctorId of uniqueProctors) {
      proctorWorkloads.set(proctorId, (proctorWorkloads.get(proctorId) ?? 0) + 1);
    }

    const dateKey = first.timeSlot?.date ?? first.timeSlot?.startTime;
    if (dateKey) {
      const parsedDay = new Date(dateKey);
      if (!Number.isNaN(parsedDay.getTime())) {
        const day = parsedDay.toISOString().slice(0, 10);
        dayExamCounts.set(day, (dayExamCounts.get(day) ?? 0) + 1);
      }
    }

    const startTime = new Date(first.timeSlot?.startTime ?? first.timeSlot?.date ?? '').getTime();
    const endTime = new Date(first.timeSlot?.endTime ?? first.timeSlot?.startTime ?? '').getTime();
    if (Number.isFinite(startTime)) {
      for (const studentId of getAssignmentStudentIds(first)) {
        const slots = studentSlotEntries.get(studentId) ?? [];
        slots.push({
          startTime,
          endTime: Number.isFinite(endTime) ? endTime : startTime,
        });
        studentSlotEntries.set(studentId, slots);
      }
    }
  }

  const workloadValues = Array.from(proctorWorkloads.values());
  const totalAssignments = workloadValues.reduce((total, load) => total + load, 0);
  const idealLoad = workloadValues.length === 0 ? 0 : totalAssignments / workloadValues.length;
  const proctorBalancePenalty = workloadValues.reduce(
    (total, load) => total + Math.abs(load - idealLoad),
    0
  );
  const maxProctorBalancePenalty =
    totalAssignments === 0 || workloadValues.length <= 1
      ? 0
      : 2 * totalAssignments * (1 - 1 / workloadValues.length);

  let totalStudentPairs = 0;
  let spacingPenalty = 0;
  for (const slots of studentSlotEntries.values()) {
    const ordered = [...slots].sort((a, b) => a.startTime - b.startTime);
    for (let left = 0; left < ordered.length; left += 1) {
      for (let right = left + 1; right < ordered.length; right += 1) {
        totalStudentPairs += 1;
        const days =
          Math.abs(ordered[right].startTime - ordered[left].startTime) / 86_400_000;
        if (days >= 1) continue;
        const minuteGap = Math.abs(ordered[right].startTime - ordered[left].endTime) / 60_000;
        spacingPenalty += minuteGap <= 30 ? 100 : 70;
      }
    }
  }

  const distributionValues = Array.from(dayExamCounts.values());
  const distributionMean =
    distributionValues.length === 0
      ? 0
      : distributionValues.reduce((sum, value) => sum + value, 0) / distributionValues.length;
  const distributionVariance =
    distributionValues.length === 0
      ? 0
      : distributionValues.reduce((sum, value) => sum + (value - distributionMean) ** 2, 0) /
        distributionValues.length;
  const maxDistributionVariance =
    examSlotGroups.size > 0 && distributionValues.length > 1
      ? (examSlotGroups.size ** 2 * (distributionValues.length - 1)) /
        distributionValues.length ** 2
      : 0;

  return {
    roomUtilization:
      totalAvailableSeats === 0
        ? null
        : roundMetric((totalUsedSeats / totalAvailableSeats) * 100),
    proctorWorkloadBalance:
      maxProctorBalancePenalty === 0
        ? totalAssignments === 0
          ? null
          : 0
        : roundMetric(100 - (proctorBalancePenalty / maxProctorBalancePenalty) * 100),
    studentSpacing:
      totalStudentPairs === 0 ? null : roundMetric(100 - spacingPenalty / totalStudentPairs),
    examDistribution:
      maxDistributionVariance === 0
        ? examSlotGroups.size > 0
          ? 100
          : null
        : roundMetric(100 - (distributionVariance / maxDistributionVariance) * 100),
  };
};

const extractOptimization = (schedule?: Schedule | null): OptimizationSnapshot => {
  const meta = schedule?.algorithmMetadata;
  if (!isObj(meta)) {
    return { before: null, after: null, improvement: null, strategy: null, attempted: false };
  }
  const evaluation = isObj(meta.evaluation) ? meta.evaluation : undefined;
  if (evaluation) {
    const before = firstNumber(evaluation, [
      ['beforeOptimization', 'score'],
      ['beforeScore'],
      ['originalScore'],
    ]);
    const after = firstNumber(evaluation, [
      ['afterOptimization', 'score'],
      ['afterScore'],
      ['optimizedScore'],
    ]);
    const improvement = firstNumber(evaluation, [['improvementPercentage']]);
    return {
      before,
      after,
      improvement: improvement ?? (before != null && after != null ? after - before : null),
      strategy: typeof meta.strategy === 'string' ? meta.strategy : null,
      attempted: true,
    };
  }
  const opt = isObj(meta.optimization) ? meta.optimization : undefined;
  if (!opt) {
    return { before: null, after: null, improvement: null, strategy: null, attempted: false };
  }
  const before =
    (typeof opt.beforeScore === 'number' ? opt.beforeScore : null) ??
    (typeof opt.before === 'number' ? opt.before : null);
  const after =
    (typeof opt.afterScore === 'number' ? opt.afterScore : null) ??
    (typeof opt.after === 'number' ? opt.after : null);
  const strategy =
    typeof opt.strategy === 'string'
      ? opt.strategy
      : typeof opt.method === 'string'
        ? opt.method
        : null;
  const improvement =
    typeof opt.improvementPercentage === 'number'
      ? opt.improvementPercentage
      : before != null && after != null
        ? after - before
        : null;
  return { before, after, improvement, strategy, attempted: true };
};

const extractQualityMetrics = (
  schedule: Schedule | undefined,
  analysis: unknown,
  assignments: ScheduleAssignment[]
): QualityMetrics => {
  const meta = schedule?.algorithmMetadata;
  const fallback = deriveAssignmentQualityMetrics(assignments);
  const sourceCandidates: unknown[] = [meta, analysis];

  return QUALITY_KEYS.reduce<QualityMetrics>(
    (acc, key) => {
      const fromSources = sourceCandidates
        .map((source) =>
          firstNumber(source, [
            ['evaluation', 'afterOptimization', 'qualityMetrics', key],
            ['evaluation', 'qualityMetrics', key],
            ['qualityMetrics', key],
            ['metrics', key],
          ])
        )
        .find((value) => value != null);

      const analysisFallback =
        key === 'roomUtilization'
          ? firstNumber(analysis, [['metrics', 'averageRoomUtilization']])
          : null;

      acc[key] = scorePct(fromSources ?? analysisFallback ?? fallback[key]);
      return acc;
    },
    { roomUtilization: null, proctorWorkloadBalance: null, studentSpacing: null, examDistribution: null }
  );
};

const extractWeakAreas = (schedule?: Schedule | null, analysis?: unknown): WeakArea[] => {
  const candidates: unknown[] = [];
  const meta = schedule?.algorithmMetadata;
  if (isObj(meta)) {
    const quality = isObj(meta.quality) ? meta.quality : null;
    if (quality && Array.isArray(quality.weakAreas)) candidates.push(...quality.weakAreas);
    if (Array.isArray(meta.weakAreas)) candidates.push(...meta.weakAreas);
  }
  if (isObj(analysis)) {
    const metrics = isObj(analysis.metrics) ? analysis.metrics : null;
    if (metrics && Array.isArray(metrics.weakAreas)) candidates.push(...metrics.weakAreas);
    if (Array.isArray(analysis.weakAreas)) candidates.push(...analysis.weakAreas);
  }
  const result: WeakArea[] = [];
  for (const candidate of candidates) {
    if (!isObj(candidate)) continue;
    const area =
      (typeof candidate.area === 'string' && candidate.area) ||
      (typeof candidate.name === 'string' && candidate.name) ||
      (typeof candidate.label === 'string' && candidate.label) ||
      null;
    const score =
      typeof candidate.score === 'number'
        ? candidate.score
        : typeof candidate.value === 'number'
          ? candidate.value
          : null;
    if (area && score != null) result.push({ area, score });
  }
  return result;
};

const buildStatus = (
  selectedSchedule: Schedule | undefined,
  assignmentsCount: number
): DashboardScheduleStatus => {
  if (!selectedSchedule) {
    return {
      tone: 'warning',
      label: 'No schedule generated',
      statusLabel: 'Action needed',
      description:
        'Generate your first exam schedule to start tracking quality and coverage.',
    };
  }
  if (selectedSchedule.isFinal) {
    return {
      tone: 'success',
      label: 'Final schedule published',
      statusLabel: 'Live',
      description: `“${selectedSchedule.name}” is live with ${
        selectedSchedule._count?.assignments ?? assignmentsCount ?? 0
      } assignments.`,
    };
  }
  return {
    tone: 'info',
    label: 'Draft schedule',
    statusLabel: 'Draft',
    description: `“${selectedSchedule.name}” is in draft. Review and publish when ready.`,
  };
};

// ---------- main hook ----------
export const useDashboardAnalytics = (
  schedules: Schedule[] | undefined,
  selectedScheduleId: string | null | undefined
): DashboardAnalyticsResult => {
  const selectedSchedule = React.useMemo(() => {
    if (!schedules?.length) return undefined;
    return (
      schedules.find((schedule) => schedule.id === selectedScheduleId) ??
      schedules[0]
    );
  }, [schedules, selectedScheduleId]);

  const detailQuery = useSchedule(selectedSchedule?.id);
  const assignmentsQuery = useScheduleAssignments(selectedSchedule?.id);
  const analysisQuery = useScheduleAnalysis(selectedSchedule?.id);

  const selectedDetailed: Schedule | undefined = detailQuery.data ?? selectedSchedule;
  const assignments: ScheduleAssignment[] = React.useMemo(
    () => assignmentsQuery.data ?? [],
    [assignmentsQuery.data]
  );

  const optimization = React.useMemo(
    () => extractOptimization(selectedDetailed),
    [selectedDetailed]
  );

  const qualityMetrics = React.useMemo(
    () => extractQualityMetrics(selectedDetailed, analysisQuery.data, assignments),
    [selectedDetailed, analysisQuery.data, assignments]
  );

  const weakAreas = React.useMemo(
    () => extractWeakAreas(selectedDetailed, analysisQuery.data),
    [selectedDetailed, analysisQuery.data]
  );

  const charts = React.useMemo<DashboardCharts>(() => {
    const byRoom = topN(groupCount(assignments, (a) => a.room?.name ?? null), 8);
    const byProctor = topN(
      groupCount(assignments, (a) => a.proctor?.user?.name ?? null),
      8
    );
    const byDay = groupCount(assignments, (a) => a.timeSlot?.date ?? null)
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
      .slice(0, 10)
      .map((d) => ({
        ...d,
        name: (() => {
          try {
            return new Date(d.name).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });
          } catch {
            return d.name;
          }
        })(),
      }));
    const byCenter = topN(
      groupCount(assignments, (a) => a.room?.center?.name ?? null),
      6
    );
    const qualityMetricBars = Object.entries(qualityMetrics)
      .filter(([, value]) => value != null)
      .map(([name, value]) => ({ name: metricLabel(name), value: value ?? 0 }));
    return { byRoom, byProctor, byDay, byCenter, qualityMetricBars };
  }, [assignments, qualityMetrics]);

  const totalConflicts = firstNumber(analysisQuery.data, [
    ['metrics', 'totalConflicts'],
    ['metrics', 'derivedConflicts'],
  ]);

  const status = React.useMemo(
    () => buildStatus(selectedSchedule, assignments.length),
    [selectedSchedule, assignments.length]
  );

  const qualityScores = {
    qualityScore: selectedDetailed?.qualityScore ?? null,
    hardConstraintScore: selectedDetailed?.hardConstraintScore ?? null,
    softConstraintScore: selectedDetailed?.softConstraintScore ?? null,
    draftScore: scorePct(optimization.before),
    optimizedScore: scorePct(optimization.after ?? selectedDetailed?.qualityScore),
    improvementScore:
      optimization.improvement != null ? Math.round(optimization.improvement) : null,
  };

  const queries = [detailQuery, assignmentsQuery, analysisQuery];

  return {
    scheduleId: selectedSchedule?.id,
    selectedSchedule,
    selectedDetailed,
    assignments,
    qualityMetrics,
    optimization,
    weakAreas,
    charts,
    qualityScores,
    totalConflicts,
    status,
    isLoading: queries.some((query) => query.isLoading),
    isFetching: queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError),
    refetch: async () => {
      await Promise.all(queries.map((query) => query.refetch()));
    },
  };
};

export { scorePct, metricLabel };
