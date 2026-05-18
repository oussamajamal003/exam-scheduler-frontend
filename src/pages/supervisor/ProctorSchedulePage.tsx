import React from 'react';
import { FullPublishedScheduleSection, RoleScheduleView } from '@/components/roleSchedule/PublishedScheduleViews';
import { useProctorDashboard } from '@/hooks/roleDashboards/useRoleDashboards';

export const ProctorSchedulePage: React.FC = () => {
  const dashboardQuery = useProctorDashboard();
  const assignments = dashboardQuery.data?.assignments ?? [];

  return (
    <div className="space-y-5 p-5 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">My Duties</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Published exam invigilation assignments</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Your main schedule is filtered to exams assigned to you only. Draft schedules and unrelated exam duties are never shown here.
        </p>
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
      />

      <FullPublishedScheduleSection />
    </div>
  );
};
