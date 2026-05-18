import React from 'react';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSpinner } from '@/components/shared/PageSpinner';
import { useProctorDashboard } from '@/hooks/roleDashboards/useRoleDashboards';

export const ProctorStudentsPage: React.FC = () => {
  const dashboardQuery = useProctorDashboard();
  const students = dashboardQuery.data?.relatedStudents ?? [];

  if (dashboardQuery.isLoading) return <PageSpinner label="Loading assigned students" />;

  return (
    <div className="space-y-5 p-5 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Assigned Students</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Students in your assigned exam rooms</h1>
      </div>

      <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            <Users className="size-4 text-zinc-400" />
            Related Students
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dashboardQuery.isError ? (
            <p className="text-sm text-rose-600 dark:text-rose-300">Unable to load assigned students.</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No related students are available yet.</p>
          ) : (
            students.map((student) => (
              <div key={student.id} className="rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-950 dark:text-zinc-50">{student.user?.name ?? 'Student'}</p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{student.user?.email ?? 'No email'}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>{student.universityId ?? 'No university ID'}</Badge>
                  {student.program?.name && <Badge variant="secondary">{student.program.name}</Badge>}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
