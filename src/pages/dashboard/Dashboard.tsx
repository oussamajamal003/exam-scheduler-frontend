import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Building2,
  CalendarClock,
  CheckCircle2,
  UserCheck,
  CalendarRange,
  Gauge,
  MapPin,
  ClipboardList,
  CalendarPlus,
  Clock4,
  Layers,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { AnalyticsCard } from '@/components/dashboard/AnalyticsCard';
import { SmartStatusCard } from '@/components/dashboard/SmartStatusCard';
import { RealBarChart } from '@/components/dashboard/RealBarChart';
import { EvaluationSummary } from '@/components/dashboard/EvaluationSummary';
import { WeakAreasPanel } from '@/components/dashboard/WeakAreasPanel';
import { ScheduleOverview } from '@/components/dashboard/ScheduleOverview';
import { OptimizationSummary } from '@/components/dashboard/OptimizationSummary';
import { QuickActions, type QuickAction } from '@/components/dashboard/QuickActions';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { useDashboardSummary } from '@/hooks/dashboard/useDashboardSummary';
import { useDashboardAnalytics } from '@/hooks/dashboard/useDashboardAnalytics';

// ---------- helpers ----------
const SELECTED_SCHEDULE_STORAGE_KEY = 'selected_schedule_id';

const formatSemesterRange = (start?: string, end?: string) => {
  if (!start && !end) return null;
  const fmt = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };
  return [fmt(start), fmt(end)].filter(Boolean).join(' – ');
};

const buildSchedulesTarget = (params?: Record<string, string>) => {
  const search = new URLSearchParams(params);
  const query = search.toString();
  return query ? `/schedules?${query}` : '/schedules';
};

const widthClassForPct = (value: number | null) => {
  const pct = value ?? 0;
  if (pct >= 95) return 'w-full';
  if (pct >= 90) return 'w-11/12';
  if (pct >= 80) return 'w-4/5';
  if (pct >= 75) return 'w-3/4';
  if (pct >= 66) return 'w-2/3';
  if (pct >= 60) return 'w-3/5';
  if (pct >= 50) return 'w-1/2';
  if (pct >= 40) return 'w-2/5';
  if (pct >= 33) return 'w-1/3';
  if (pct >= 25) return 'w-1/4';
  if (pct >= 20) return 'w-1/5';
  if (pct >= 10) return 'w-[10%]';
  if (pct > 0) return 'w-[5%]';
  return 'w-0';
};

// ---------- component ----------
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const goToScheduleGenerate = React.useCallback(() => {
    navigate(buildSchedulesTarget({ openGenerate: 'true', view: 'table' }));
  }, [navigate]);

  const goToAssignmentsTable = React.useCallback(() => {
    navigate(buildSchedulesTarget({ view: 'table' }));
  }, [navigate]);

  const userQ = useCurrentUser();
  const summary = useDashboardSummary();
  const [selectedScheduleId, setSelectedScheduleId] = React.useState<string | null>(() =>
    localStorage.getItem(SELECTED_SCHEDULE_STORAGE_KEY)
  );
  const analytics = useDashboardAnalytics(summary.sortedSchedules, selectedScheduleId);

  const { counts, sortedSchedules, activeSemester, isLoading: summaryLoading } = summary;
  const {
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
  } = analytics;

  const optimizationScoreDisplay = qualityScores.optimizedScore ?? qualityScores.draftScore;

  const qualityMetricEntries = [
    {
      key: 'roomUtilization',
      label: 'Room Utilization',
      value: qualityMetrics.roomUtilization,
      tone: 'bg-indigo-500',
    },
    {
      key: 'proctorWorkloadBalance',
      label: 'Proctor Workload Balance',
      value: qualityMetrics.proctorWorkloadBalance,
      tone: 'bg-violet-500',
    },
    {
      key: 'studentSpacing',
      label: 'Student Spacing',
      value: qualityMetrics.studentSpacing,
      tone: 'bg-sky-500',
    },
    {
      key: 'examDistribution',
      label: 'Exam Distribution',
      value: qualityMetrics.examDistribution,
      tone: 'bg-emerald-500',
    },
  ];

  const quickActions: QuickAction[] = [
    {
      label: 'Generate Schedule',
      description: 'Run hybrid optimizer',
      icon: CalendarPlus,
      tone: 'indigo',
      onClick: goToScheduleGenerate,
    },
    {
      label: 'Manage Rooms',
      description: `${counts.totalRooms} rooms`,
      icon: Building2,
      tone: 'emerald',
      onClick: () => navigate('/rooms'),
    },
    {
      label: 'Manage Proctors',
      description: `${counts.totalProctors} proctors`,
      icon: UserCheck,
      tone: 'violet',
      onClick: () => navigate('/proctors'),
    },
    {
      label: 'View Exams',
      description: `${counts.totalExams} assignment rows`,
      icon: ClipboardList,
      tone: 'sky',
      onClick: goToAssignmentsTable,
    },
    {
      label: 'Course Offerings',
      icon: Layers,
      tone: 'amber',
      onClick: () => navigate('/course-offerings'),
    },
    {
      label: 'Time Slots',
      icon: Clock4,
      tone: 'zinc',
      onClick: () => navigate('/timeslots'),
    },
  ];

  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      <DashboardHeader
        userName={userQ.data?.name}
        semesterName={activeSemester?.name}
        semesterRange={formatSemesterRange(activeSemester?.startDate, activeSemester?.endDate)}
        scheduleStatusLabel={status.label}
        scheduleStatusTone={status.tone}
        onGenerateSchedule={goToScheduleGenerate}
        onViewSchedules={() => navigate('/schedules')}
      />

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Total Students"
          value={counts.totalStudents}
          icon={Users}
          accent="indigo"
          loading={summaryLoading}
          subtitle="Enrolled in system"
        />
        <AnalyticsCard
          title="Total Courses"
          value={counts.totalCourses}
          icon={BookOpen}
          accent="sky"
          loading={summaryLoading}
          subtitle="Across all programs"
        />
        <AnalyticsCard
          title="Total Rooms"
          value={counts.totalRooms}
          icon={Building2}
          accent="emerald"
          loading={summaryLoading}
          subtitle="Available capacity"
        />
        <AnalyticsCard
          title="Total Proctors"
          value={counts.totalProctors}
          icon={UserCheck}
          accent="violet"
          loading={summaryLoading}
          subtitle="Ready for assignment"
        />
        <AnalyticsCard
          title="Total Schedules"
          value={counts.totalSchedules}
          icon={CalendarRange}
          accent="zinc"
          loading={summaryLoading}
          subtitle={`${counts.activeExamPeriods} published`}
        />
        <AnalyticsCard
          title="Published Assignments"
          value={counts.publishedAssignments}
          icon={CheckCircle2}
          accent="emerald"
          loading={summaryLoading}
          subtitle="From final schedules"
        />
        <AnalyticsCard
          title="Active Exam Periods"
          value={counts.activeExamPeriods}
          icon={CalendarClock}
          accent="amber"
          loading={summaryLoading}
          subtitle="Currently published"
        />
        <AnalyticsCard
          title="Optimization Score"
          value={optimizationScoreDisplay ?? '—'}
          icon={Gauge}
          accent={
            optimizationScoreDisplay == null
              ? 'zinc'
              : optimizationScoreDisplay >= 85
                ? 'emerald'
                : optimizationScoreDisplay >= 65
                  ? 'sky'
                  : optimizationScoreDisplay >= 40
                    ? 'amber'
                    : 'rose'
          }
          loading={analytics.isLoading}
          subtitle={selectedSchedule ? 'Selected schedule quality' : 'No schedules yet'}
        />
      </div>

      {/* Selected schedule score summaries */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          title="Draft Score"
          value={qualityScores.draftScore != null ? `${qualityScores.draftScore}%` : '—'}
          icon={ShieldCheck}
          accent="zinc"
          loading={analytics.isLoading}
          subtitle="Before optimization"
        />
        <AnalyticsCard
          title="Optimized Score"
          value={
            qualityScores.optimizedScore != null ? `${qualityScores.optimizedScore}%` : '—'
          }
          icon={Gauge}
          accent="emerald"
          loading={analytics.isLoading}
          subtitle="After optimization"
        />
        <AnalyticsCard
          title="Optimization Improvement"
          value={
            qualityScores.improvementScore != null
              ? `${qualityScores.improvementScore}%`
              : '—'
          }
          icon={TrendingUp}
          accent="sky"
          loading={analytics.isLoading}
          subtitle="Score delta"
        />
        <AnalyticsCard
          title="Detected Conflicts"
          value={totalConflicts ?? '—'}
          icon={AlertTriangle}
          accent={totalConflicts && totalConflicts > 0 ? 'rose' : 'emerald'}
          loading={analytics.isLoading}
          subtitle="Analysis endpoint"
        />
      </div>

      <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <CardHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800/70">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            <Gauge className="size-4 text-zinc-400 dark:text-zinc-500" />
            Selected Schedule Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          {qualityMetricEntries.map((metric) => (
            <div key={metric.key} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {metric.label}
                </p>
                <span className="text-sm font-bold tabular-nums text-zinc-950 dark:text-zinc-50">
                  {metric.value != null ? `${metric.value}%` : '—'}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-none bg-zinc-100 dark:bg-zinc-800/70">
                <div
                  className={`h-full rounded-none transition-all duration-700 ${metric.tone} ${widthClassForPct(metric.value)}`}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Smart status + Quick actions */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <SmartStatusCard
          title={status.label}
          description={status.description}
          statusLabel={status.statusLabel}
          tone={status.tone}
          icon={status.tone === 'warning' ? AlertTriangle : CalendarClock}
          loading={summaryLoading}
          metadata={[
            { label: 'Schedules', value: counts.totalSchedules },
            { label: 'Published', value: counts.activeExamPeriods },
            {
              label: 'Assignments',
              value: selectedSchedule?._count?.assignments ?? assignments.length ?? 0,
            },
            {
              label: 'Quality',
              value:
                optimizationScoreDisplay != null ? `${optimizationScoreDisplay}/100` : '—',
            },
          ]}
          action={{ label: 'Open Schedules', onClick: () => navigate('/schedules') }}
        />
        <QuickActions actions={quickActions} />
      </div>

      {/* Charts grid */}
      <div className="grid gap-4 xl:grid-cols-2">
        <RealBarChart
          title="Assignments by Room"
          icon={Building2}
          data={charts.byRoom}
          tone="indigo"
          loading={analytics.isLoading}
          emptyLabel={
            selectedSchedule ? 'No assignments yet' : 'Generate a schedule to see room load'
          }
        />
        <RealBarChart
          title="Assignments by Proctor"
          icon={UserCheck}
          data={charts.byProctor}
          tone="violet"
          loading={analytics.isLoading}
          emptyLabel={
            selectedSchedule
              ? 'No assignments yet'
              : 'Generate a schedule to see proctor load'
          }
        />
        <RealBarChart
          title="Assignments by Day"
          icon={CalendarClock}
          data={charts.byDay}
          tone="sky"
          loading={analytics.isLoading}
          emptyLabel={
            selectedSchedule
              ? 'No scheduled days yet'
              : 'Generate a schedule to see day distribution'
          }
        />
        <RealBarChart
          title="Assignments by Center"
          icon={MapPin}
          data={charts.byCenter}
          tone="emerald"
          loading={analytics.isLoading}
          emptyLabel={
            selectedSchedule
              ? 'No centers mapped yet'
              : 'Generate a schedule to see center load'
          }
        />
        <RealBarChart
          title="Quality Metric Scores"
          icon={Gauge}
          data={charts.qualityMetricBars}
          tone="amber"
          total={100}
          formatValue={(value) => `${value}%`}
          loading={analytics.isLoading}
          emptyLabel="No quality metrics available for the selected schedule"
        />
      </div>

      {/* Evaluation + Weak areas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <EvaluationSummary
          qualityScore={selectedDetailed?.qualityScore}
          hardConstraintScore={selectedDetailed?.hardConstraintScore}
          softConstraintScore={selectedDetailed?.softConstraintScore}
          loading={analytics.isLoading}
        />
        <WeakAreasPanel weakAreas={weakAreas} loading={analytics.isLoading} />
      </div>

      {/* Optimization + Recent schedules */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <OptimizationSummary
          beforeScore={optimization.before}
          afterScore={optimization.after}
          strategy={optimization.strategy}
          attempted={optimization.attempted}
          loading={analytics.isLoading}
        />
        <ScheduleOverview
          schedules={sortedSchedules}
          loading={summary.isLoading}
          onOpen={(schedule) => {
            localStorage.setItem(SELECTED_SCHEDULE_STORAGE_KEY, schedule.id);
            setSelectedScheduleId(schedule.id);
            navigate(buildSchedulesTarget({ scheduleId: schedule.id, view: 'table' }));
          }}
          onViewAll={() => navigate('/schedules')}
        />
      </div>
    </div>
  );
};
