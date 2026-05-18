import React from 'react';
import { FullPublishedScheduleSection, RoleScheduleView } from '@/components/roleSchedule/PublishedScheduleViews';
import { useStudentDashboard } from '@/hooks/roleDashboards/useRoleDashboards';

export const StudentSchedulePage: React.FC = () => {
  const dashboardQuery = useStudentDashboard();
  const assignments = dashboardQuery.data?.assignments ?? [];

  return (
    <div className="space-y-5 p-5 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">My Exam Schedule</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Published exams for your registrations</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Your main schedule is filtered to exams connected to your registrations only. Draft schedules and unrelated exams are never shown here.
        </p>
      </div>

      <RoleScheduleView
        title="My Published Exams"
        description="Table and calendar views use the same student-only published exam assignments."
        assignments={assignments}
        loading={dashboardQuery.isLoading}
        error={dashboardQuery.isError}
        emptyLabel="No published exam schedule available yet."
        errorLabel="Unable to load your published exam schedule."
      />

      <FullPublishedScheduleSection />
    </div>
  );
};
