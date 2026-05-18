import React from 'react';
import { BookOpen, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSpinner } from '@/components/shared/PageSpinner';
import { useStudentDashboard } from '@/hooks/roleDashboards/useRoleDashboards';

export const StudentCoursesPage: React.FC = () => {
  const dashboardQuery = useStudentDashboard();
  const courses = dashboardQuery.data?.courses ?? [];

  if (dashboardQuery.isLoading) return <PageSpinner label="Loading student courses" />;

  return (
    <div className="space-y-5 p-5 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">My Courses</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Registered course offerings</h1>
      </div>

      <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            <BookOpen className="size-4 text-zinc-400" />
            Enrollments
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dashboardQuery.isError ? (
            <p className="text-sm text-rose-600 dark:text-rose-300">Unable to load your courses.</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No registered courses found.</p>
          ) : (
            courses.map((courseOffering) => (
              <div key={courseOffering.id} className="rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-950 dark:text-zinc-50">{courseOffering.course?.code ?? 'Course'}</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{courseOffering.course?.title ?? 'Untitled course'}</p>
                  </div>
                  <GraduationCap className="size-4 shrink-0 text-zinc-400" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>{courseOffering.semester?.name ?? 'Semester TBD'}</Badge>
                  <Badge variant={courseOffering.hasExam ? 'success' : 'secondary'}>{courseOffering.hasExam ? 'Exam' : 'No Exam'}</Badge>
                  {courseOffering.section && <Badge variant="secondary">Section {courseOffering.section}</Badge>}
                </div>
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Instructor: {courseOffering.instructor ?? 'Not assigned'}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
