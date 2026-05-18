import React from 'react';
import { BookOpen, GraduationCap, List, PanelsTopLeft, ShieldCheck, Table2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStudentDashboard } from '@/hooks/roleDashboards/useRoleDashboards';
import type { StudentCourseDashboardItem } from '@/api/roleDashboard.api';
import { cn } from '@/lib/utils';

type ViewMode = 'cards' | 'table';

const getExamStatus = (courseOffering: StudentCourseDashboardItem) => {
  if (!courseOffering.hasExam) return { label: 'No exam required', variant: 'secondary' as const };
  if (courseOffering.exams.some((exam) => exam.assignments.length > 0)) {
    return { label: 'Exam scheduled', variant: 'success' as const };
  }
  return { label: 'Eligible for exam', variant: 'default' as const };
};

const CourseSkeleton = () => (
  <div className="space-y-5 p-5 sm:p-6 lg:p-8">
    <div className="space-y-2">
      <Skeleton className="h-3 w-36" />
      <Skeleton className="h-8 w-72" />
    </div>
    <Skeleton className="h-28" />
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="h-48" />)}
    </div>
  </div>
);

const CourseCard = ({ courseOffering }: { courseOffering: StudentCourseDashboardItem }) => {
  const examStatus = getExamStatus(courseOffering);
  const course = courseOffering.course;

  return (
    <div className="rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-zinc-950 dark:text-zinc-50">{course?.code ?? 'Course'}</p>
          <p className="mt-1 text-sm leading-5 text-zinc-600 dark:text-zinc-300">{course?.title ?? 'Untitled course'}</p>
        </div>
        <GraduationCap className="size-5 shrink-0 text-zinc-400" />
      </div>

      <div className="mt-4 grid gap-3 text-xs text-zinc-500 dark:text-zinc-400 sm:grid-cols-2">
        <div>
          <p className="font-semibold uppercase tracking-[0.16em] text-zinc-400">Instructor</p>
          <p className="mt-1 font-medium text-zinc-700 dark:text-zinc-200">{courseOffering.instructor ?? 'Not assigned'}</p>
        </div>
        <div>
          <p className="font-semibold uppercase tracking-[0.16em] text-zinc-400">Semester</p>
          <p className="mt-1 font-medium text-zinc-700 dark:text-zinc-200">{courseOffering.semester?.name ?? 'Semester TBD'}</p>
        </div>
        <div>
          <p className="font-semibold uppercase tracking-[0.16em] text-zinc-400">Credits</p>
          <p className="mt-1 font-medium text-zinc-700 dark:text-zinc-200">{course?.credits ?? 'Not set'}</p>
        </div>
        <div>
          <p className="font-semibold uppercase tracking-[0.16em] text-zinc-400">Section</p>
          <p className="mt-1 font-medium text-zinc-700 dark:text-zinc-200">{courseOffering.section ?? 'Default'}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant={examStatus.variant}>{examStatus.label}</Badge>
        <Badge variant="secondary">{courseOffering.status ?? 'ACTIVE'}</Badge>
        {courseOffering.courseType && <Badge variant="secondary">{courseOffering.courseType}</Badge>}
      </div>
    </div>
  );
};

export const StudentCoursesPage: React.FC = () => {
  const dashboardQuery = useStudentDashboard();
  const courses = dashboardQuery.data?.courses ?? [];
  const [viewMode, setViewMode] = React.useState<ViewMode>('cards');

  if (dashboardQuery.isLoading) return <CourseSkeleton />;

  return (
    <div className="space-y-5 p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">My Courses</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Registered course offerings</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Courses shown here come from your active student registrations only.
          </p>
        </div>

        <div className="inline-flex w-fit rounded-md border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {([
            ['cards', PanelsTopLeft, 'Cards'],
            ['table', Table2, 'Table'],
          ] as const).map(([mode, Icon, label]) => (
            <Button
              key={mode}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setViewMode(mode)}
              className={cn(
                'h-8 rounded-sm px-3 text-xs font-semibold',
                viewMode === mode
                  ? 'bg-zinc-950 text-white hover:bg-zinc-900 hover:text-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50'
              )}
            >
              <Icon className="mr-2 size-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-none bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Registered Courses</p>
              <p className="mt-1 text-3xl font-bold text-zinc-950 dark:text-zinc-50">{courses.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-none bg-emerald-600 text-white">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Exam Eligible</p>
              <p className="mt-1 text-3xl font-bold text-zinc-950 dark:text-zinc-50">{courses.filter((course) => course.hasExam).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-none bg-sky-600 text-white">
              <List className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Scheduled Exams</p>
              <p className="mt-1 text-3xl font-bold text-zinc-950 dark:text-zinc-50">
                {courses.filter((course) => course.exams.some((exam) => exam.assignments.length > 0)).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <CardHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800/70">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            <BookOpen className="size-4 text-zinc-400" />
            Enrollments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {dashboardQuery.isError ? (
            <p className="text-sm text-rose-600 dark:text-rose-300">Unable to load your courses.</p>
          ) : courses.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">No registered courses found.</p>
          ) : viewMode === 'cards' ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((courseOffering) => <CourseCard key={courseOffering.registrationId} courseOffering={courseOffering} />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-200 dark:border-zinc-800">
                  <TableHead>Course Code</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Exam Eligibility</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((courseOffering) => {
                  const examStatus = getExamStatus(courseOffering);
                  return (
                    <TableRow key={courseOffering.registrationId} className="border-zinc-200/70 dark:border-zinc-800/70">
                      <TableCell className="font-semibold text-zinc-950 dark:text-zinc-50">{courseOffering.course?.code ?? 'Course'}</TableCell>
                      <TableCell className="max-w-xs whitespace-normal text-zinc-600 dark:text-zinc-300">{courseOffering.course?.title ?? 'Untitled course'}</TableCell>
                      <TableCell>{courseOffering.instructor ?? 'Not assigned'}</TableCell>
                      <TableCell>{courseOffering.semester?.name ?? 'Semester TBD'}</TableCell>
                      <TableCell>{courseOffering.course?.credits ?? 'Not set'}</TableCell>
                      <TableCell><Badge variant={examStatus.variant}>{examStatus.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
