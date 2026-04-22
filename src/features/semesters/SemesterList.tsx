import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Semester } from "../../schemas/semester";
import { CalendarRange, Edit2, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { TableSkeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/shared/EmptyState";

export type DerivedSemesterStatus = "ACTIVE" | "UPCOMING" | "PAST";

interface SemesterListProps {
  semesters: Semester[];
  isLoading?: boolean;
  isDeleting?: boolean;
  onEditSemester: (semester: Semester) => void;
  onDeleteSemester: (semester: Semester) => void;
  onAddSemester?: () => void;
}

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const computeStatus = (semester: Semester): DerivedSemesterStatus => {
  if (semester.status) return semester.status;
  const now = Date.now();
  const start = semester.startDate ? new Date(semester.startDate).getTime() : NaN;
  const end = semester.endDate ? new Date(semester.endDate).getTime() : NaN;
  if (!Number.isNaN(start) && now < start) return "UPCOMING";
  if (!Number.isNaN(end) && now > end) return "PAST";
  return "ACTIVE";
};

const STATUS_STYLES: Record<DerivedSemesterStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  UPCOMING: "bg-blue-50 text-blue-700 border-blue-200",
  PAST: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

const StatusBadge = ({ status }: { status: DerivedSemesterStatus }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-none border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.1em]",
      STATUS_STYLES[status]
    )}
  >
    <span
      className={cn(
        "size-1.5 rounded-full",
        status === "ACTIVE" && "bg-emerald-500 animate-pulse",
        status === "UPCOMING" && "bg-blue-500",
        status === "PAST" && "bg-zinc-400"
      )}
    />
    {status}
  </span>
);

export function SemesterList({
  semesters,
  isLoading,
  isDeleting,
  onEditSemester,
  onDeleteSemester,
  onAddSemester,
}: SemesterListProps) {
  const semesterRows = Array.isArray(semesters) ? semesters : [];

  if (isLoading) {
    return <TableSkeleton columns={5} rows={8} />;
  }

  return (
    <Card className="overflow-hidden rounded-none border border-zinc-200/80 bg-white/90 shadow-lg shadow-zinc-200/40">
      <CardHeader className="flex flex-col gap-4 border-b border-zinc-200/60 px-4 py-5 sm:px-6 sm:py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-none bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-sm shadow-zinc-950/10">
            Academic Calendar
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
            Semester Management
          </CardTitle>
          <p className="text-sm leading-6 text-zinc-500 max-w-2xl">
            Define academic terms, track active periods, and align course offerings with each semester window.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-none bg-linear-to-br from-zinc-50 to-zinc-100/80 px-5 py-3 border border-zinc-200/60 shadow-sm">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Total Semesters</p>
            <p className="text-3xl font-bold tracking-tight text-zinc-950 mt-1">{semesterRows.length}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-b border-zinc-200/60 hover:bg-transparent bg-zinc-50/40">
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Name</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Start Date</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">End Date</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Status</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Total Offerings</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {semesterRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={CalendarRange}
                      title="No semesters yet"
                      description="Create your first semester to start scheduling course offerings and exams."
                      action={
                        onAddSemester
                          ? { label: "Add Semester", onClick: onAddSemester }
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                semesterRows.map((semester, idx) => {
                  const status = computeStatus(semester);
                  const isActiveRow = status === "ACTIVE";
                  const isPastRow = status === "PAST";

                  return (
                    <TableRow
                      key={semester.id}
                      className={cn(
                        "border-b border-zinc-200/40 transition-all duration-200 hover:bg-zinc-50/60",
                        idx === semesterRows.length - 1 && "border-b-0",
                        isActiveRow && "bg-emerald-50/40 shadow-[inset_4px_0_0_0_#10b981]",
                        isPastRow && "opacity-70"
                      )}
                    >
                      <TableCell className="px-4 py-4 sm:px-6">
                        <div className="font-semibold text-zinc-950 text-sm flex items-center gap-2">
                          {semester?.name ?? "Untitled"}
                          {semester?.isCurrent && (
                            <span className="inline-flex items-center rounded-none border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                              Current
                            </span>
                          )}
                        </div>
                        {semester?.academicYear && (
                          <p className="text-xs text-zinc-500 mt-0.5">AY {semester.academicYear}</p>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6 text-sm text-zinc-700">
                        {formatDate(semester?.startDate)}
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6 text-sm text-zinc-700">
                        {formatDate(semester?.endDate)}
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6">
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6 text-right">
                        <span className="inline-flex items-center justify-center rounded-none bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700 min-w-[2.5rem]">
                          {semester?.courseOfferingsCount ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditSemester(semester)}
                            className="h-8 w-8 rounded-none text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors p-0 flex items-center justify-center"
                            title="Edit semester"
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => onDeleteSemester(semester)}
                            className="h-8 w-8 rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors p-0 flex items-center justify-center disabled:opacity-50"
                            title="Delete semester"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
