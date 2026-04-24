import { BookOpen, ClipboardList, GraduationCap, Hash, Layers, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Card, CardContent } from "../../components/ui/card";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { EmptyState } from "../../components/shared/EmptyState";
import { getApiErrorMessage } from "../../lib/apiError";
import { useCourseDetail } from "../../hooks/courses/useCourses";
import type { Course } from "../../schemas/course";

interface CourseDetailDialogProps {
  course: Course | null;
  open: boolean;
  onClose: () => void;
}

export function CourseDetailDialog({ course, open, onClose }: CourseDetailDialogProps) {
  const { data: detail, isLoading, isError, error } = useCourseDetail(open ? course?.id : undefined);
  const view = detail ?? (course ? { ...course, offerings: [], description: null, credits: null } : null);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="size-5 text-zinc-600" />
            {view?.name ?? "Course Details"}
          </DialogTitle>
        </DialogHeader>

        {isLoading && <PageSpinner label="Loading course details" className="min-h-40" />}

        {isError && (
          <div className="rounded-none border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive">
            {getApiErrorMessage(error, "Failed to load course details.")}
          </div>
        )}

        {view && !isLoading && !isError && (
          <div className="space-y-6 mt-2">
            {/* Hero card */}
            <Card className="rounded-none border border-zinc-200/60 bg-linear-to-br from-zinc-50 to-white">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-none bg-zinc-950 p-2.5 text-white shadow-sm shrink-0">
                    <BookOpen className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-none bg-indigo-50 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-indigo-700">
                        <Hash className="size-3" />
                        {view.code}
                      </span>
                    </div>
                    <h2 className="mt-1.5 text-xl font-bold text-zinc-950">{view.name}</h2>
                    {view.description && (
                      <p className="mt-1 text-sm text-zinc-500 leading-relaxed">{view.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-none border border-zinc-200/60 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">Program</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <GraduationCap className="size-3.5 shrink-0 text-zinc-500" />
                  <p className="truncate text-sm font-semibold text-zinc-950">{view.program || "—"}</p>
                </div>
              </div>
              <div className="rounded-none border border-zinc-200/60 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">Credits</p>
                <p className="mt-1.5 text-2xl font-bold text-zinc-950">
                  {detail?.credits ?? "—"}
                </p>
              </div>
              <div className="rounded-none border border-zinc-200/60 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">Offerings</p>
                <p className="mt-1.5 text-2xl font-bold text-zinc-950">
                  {detail?.offerings.length ?? 0}
                </p>
              </div>
              <div className="rounded-none border border-zinc-200/60 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">Total Enrolled</p>
                <p className="mt-1.5 text-2xl font-bold text-zinc-950">
                  {detail?.offerings.reduce((sum, o) => sum + o.registrationsCount, 0) ?? 0}
                </p>
              </div>
            </div>

            {/* Offerings section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-zinc-700">
                  <Layers className="size-4" /> Course Offerings
                </h3>
                <span className="text-xs text-zinc-500">{detail?.offerings.length ?? 0} total</span>
              </div>

              {!detail || detail.offerings.length === 0 ? (
                <EmptyState
                  icon={Layers}
                  title="No offerings yet"
                  description="This course has not been assigned to any semester offering."
                />
              ) : (
                <div className="space-y-2">
                  {detail.offerings.map((offering) => (
                    <div
                      key={offering.id}
                      className="flex items-center justify-between gap-4 rounded-none border border-zinc-200/60 bg-white px-4 py-3 hover:bg-zinc-50/60 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-950 truncate">{offering.semesterName}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <Users className="size-3.5 text-violet-500" />
                          <span className="font-semibold text-zinc-700">{offering.registrationsCount}</span>
                          <span>enrolled</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <ClipboardList className="size-3.5 text-amber-500" />
                          <span className="font-semibold text-zinc-700">{offering.examsCount}</span>
                          <span>exams</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
