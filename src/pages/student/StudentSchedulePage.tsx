import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { FullPublishedScheduleSection, RoleScheduleView } from '@/components/roleSchedule/PublishedScheduleViews';
import { DownloadPdfButton } from '@/components/roleSchedule/DownloadPdfButton';
import { useStudentDashboard } from '@/hooks/roleDashboards/useRoleDashboards';
import { useSchedulePdfDownload } from '@/hooks/schedulePdf/useSchedulePdfDownload';
import { downloadStudentSchedulePdf } from '@/api/schedulePdf.api';
import { useHighlightRow } from '@/hooks/common/useHighlightRow';

export const StudentSchedulePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const dashboardQuery = useStudentDashboard();
  const assignments = dashboardQuery.data?.assignments ?? [];

  const resolvedHighlightId = React.useMemo(() => {
    const assignmentId = searchParams.get('assignmentId');
    if (assignmentId) return assignmentId;
    const examId = searchParams.get('examId');
    if (examId) return assignments.find((a) => a.examId === examId)?.id ?? null;
    const scheduleId = searchParams.get('scheduleId');
    if (scheduleId) return assignments.find((a) => a.schedule?.id === scheduleId)?.id ?? null;
    const roomId = searchParams.get('roomId');
    if (roomId) return assignments.find((a) => a.room?.id === roomId)?.id ?? null;
    const centerId = searchParams.get('centerId');
    if (centerId) return assignments.find((a) => a.room?.center?.id === centerId)?.id ?? null;
    return null;
  }, [assignments, searchParams]);
  useHighlightRow('data-assignment-id', resolvedHighlightId, assignments.length);

  const { download, isDownloading } = useSchedulePdfDownload();

  const handleDownload = () =>
    download(() => downloadStudentSchedulePdf(), {
      startTitle: 'Preparing your schedule',
      successTitle: 'Schedule downloaded',
      errorTitle: 'Unable to download schedule',
    });

  return (
    <div className="space-y-5 p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">My Exam Schedule</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Published exams for your registrations</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Your main schedule is filtered to exams connected to your registrations only. Draft schedules and unrelated exams are never shown here.
          </p>
        </div>
        <DownloadPdfButton
          onClick={handleDownload}
          loading={isDownloading}
          disabled={assignments.length === 0}
          label="Download My Schedule"
          variant="primary"
          size="default"
        />
      </div>

      <RoleScheduleView
        title="My Published Exams"
        description="Table and calendar views use the same student-only published exam assignments."
        assignments={assignments}
        dedupeLogicalAssignments
        loading={dashboardQuery.isLoading}
        error={dashboardQuery.isError}
        emptyLabel="No published exam schedule available yet."
        errorLabel="Unable to load your published exam schedule."
        showFilters
        filterResultLabel={(visible, total) => `Showing ${visible} of ${total} exam${total === 1 ? '' : 's'}`}
        filterEmptyLabel="No published exams match the current filters."
        headerActions={(
          <DownloadPdfButton
            onClick={handleDownload}
            loading={isDownloading}
            disabled={assignments.length === 0}
            label="Download My Schedule"
          />
        )}
      />

      <FullPublishedScheduleSection portal="student" showAdvancedFilters />
    </div>
  );
};
