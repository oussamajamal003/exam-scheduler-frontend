import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { FullPublishedScheduleSection, RoleScheduleView } from '@/components/roleSchedule/PublishedScheduleViews';
import { DownloadPdfButton } from '@/components/roleSchedule/DownloadPdfButton';
import { useProctorDashboard } from '@/hooks/roleDashboards/useRoleDashboards';
import { useSchedulePdfDownload } from '@/hooks/schedulePdf/useSchedulePdfDownload';
import { downloadProctorSchedulePdf } from '@/api/schedulePdf.api';
import { useHighlightRow } from '@/hooks/common/useHighlightRow';
import { normalizeCommandSearchText } from '@/lib/searchText';

export const ProctorSchedulePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const dashboardQuery = useProctorDashboard();
  const assignments = dashboardQuery.data?.assignments ?? [];
  const commandSearchText = normalizeCommandSearchText(searchParams.get('_hl'));

  const resolvedHighlightId = React.useMemo(() => {
    const assignmentId = searchParams.get('assignmentId') ?? searchParams.get('examId');
    if (assignmentId) return assignmentId;
    const scheduleId = searchParams.get('scheduleId');
    if (scheduleId) return assignments.find((a) => a.schedule?.id === scheduleId)?.id ?? null;
    const courseId = searchParams.get('courseId');
    if (courseId) return assignments.find((a) => a.exam?.courseOffering?.course?.id === courseId)?.id ?? null;
    const roomId = searchParams.get('roomId');
    if (roomId) return assignments.find((a) => a.room?.id === roomId)?.id ?? null;
    const centerId = searchParams.get('centerId');
    if (centerId) return assignments.find((a) => a.room?.center?.id === centerId)?.id ?? null;
    return null;
  }, [assignments, searchParams]);
  useHighlightRow('data-assignment-id', resolvedHighlightId, assignments.length);

  const { download, isDownloading } = useSchedulePdfDownload();

  const handleDownload = () =>
    download(() => downloadProctorSchedulePdf(), {
      startTitle: 'Preparing your duties',
      successTitle: 'Duties downloaded',
      errorTitle: 'Unable to download duties',
    });

  return (
    <div className="space-y-5 p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">My Duties</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Published exam invigilation assignments</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Your main schedule is filtered to exams assigned to you only. Draft schedules and unrelated exam duties are never shown here.
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
        title="My Published Duties"
        description="Table and calendar views use the same proctor-only published exam assignments."
        assignments={assignments}
        loading={dashboardQuery.isLoading}
        error={dashboardQuery.isError}
        emptyLabel="No published duties are assigned to you yet."
        errorLabel="Unable to load your published duty schedule."
        secondaryLabel={(assignment) => `${assignment.exam?.courseOffering?.registrations?.length ?? 0} related students`}
        tableMode="proctor"
        showFilters
        initialQuery={commandSearchText}
        filterResultLabel={(visible, total) => `Showing ${visible} of ${total} assignment${total === 1 ? '' : 's'}`}
        filterEmptyLabel="No published assignments match the current filters."
        headerActions={(
          <DownloadPdfButton
            onClick={handleDownload}
            loading={isDownloading}
            disabled={assignments.length === 0}
            label="Download My Schedule"
          />
        )}
      />

      <FullPublishedScheduleSection portal="proctor" showAdvancedFilters />
    </div>
  );
};
