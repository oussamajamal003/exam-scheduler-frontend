import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Course } from "../../schemas/course";
import { Edit2, Trash2, Library, BookOpen } from "lucide-react";
import { cn } from "../../lib/utils";
import { TableSkeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/shared/EmptyState";

interface CourseListProps {
  courses: Course[];
  isLoading?: boolean;
  isDeleting?: boolean;
  onEditCourse: (course: Course) => void;
  onViewDetails: (course: Course) => void;
  onDeleteCourse: (course: Course) => void;
}

export function CourseList({ courses, isLoading, isDeleting, onEditCourse, onViewDetails, onDeleteCourse }: CourseListProps) {
  const courseRows = Array.isArray(courses) ? courses : [];

  if (isLoading) {
    return <TableSkeleton columns={5} rows={8} />;
  }

  return (
    <Card className="overflow-hidden rounded-none border border-zinc-200/80 bg-white/90 shadow-lg shadow-zinc-200/40">
      <CardHeader className="flex flex-col gap-4 border-b border-zinc-200/60 px-4 py-5 sm:px-6 sm:py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-none bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-sm shadow-zinc-950/10">
            Curriculum
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">Course Management</CardTitle>
          <p className="text-sm leading-6 text-zinc-500 max-w-2xl">Define standard course codes, categorize by program, and prepare exam requirements.</p>
        </div>
        <div className="flex items-center gap-2 rounded-none bg-linear-to-br from-zinc-50 to-zinc-100/80 px-5 py-3 border border-zinc-200/60 shadow-sm">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Total Courses</p>
            <p className="text-3xl font-bold tracking-tight text-zinc-950 mt-1">{courseRows.length}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-b border-zinc-200/60 hover:bg-transparent bg-zinc-50/40">
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Code</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Course Name</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Program / Semester</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Details</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={Library}
                      title="No courses found"
                      description="Create a curriculum block to link students and exams."
                      action={{
                        label: "Add Course",
                        onClick: () => {},
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                courseRows.map((course, idx) => (
                  <TableRow
                    key={course.id}
                    className={cn(
                      "border-b border-zinc-200/40 transition-all duration-200 hover:bg-zinc-50/60",
                      idx === courseRows.length - 1 && "border-b-0"
                    )}
                  >
                    <TableCell className="px-4 py-4 sm:px-6">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded text-sm tracking-wide">{course.code}</span>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <div className="font-semibold text-zinc-950 text-sm">{course.name}</div>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <div className="font-medium text-zinc-800 text-sm">{course.program}</div>
                      <p className="text-xs text-zinc-500 mt-0.5">{course.semester}</p>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(course)}
                        className="h-8 rounded-none text-xs font-semibold text-zinc-600 hover:bg-emerald-100/50 hover:text-emerald-700 transition-colors"
                      >
                        <BookOpen className="size-3.5 mr-1.5" />
                        Details
                      </Button>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditCourse(course)}
                          className="h-8 w-8 rounded-none text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors p-0 flex items-center justify-center"
                          title="Edit course"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => onDeleteCourse(course)}
                          className="h-8 w-8 rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors p-0 flex items-center justify-center disabled:opacity-50"
                          title="Delete course"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
