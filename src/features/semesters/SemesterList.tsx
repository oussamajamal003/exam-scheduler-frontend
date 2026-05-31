import { useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Semester } from "../../schemas/semester";
import { CalendarRange, Edit2, Trash2, Zap } from "lucide-react";
import { cn } from "../../lib/utils";
import { TableSkeletonRows } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/shared/EmptyState";
import { RowSelectCheckbox } from "../../components/shared/BulkTableActions";
import { useVirtualRows } from "../../hooks/common/useVirtualRows";

interface SemesterListProps {
  semesters: Semester[];
  isLoading?: boolean;
  isDeleting?: boolean;
  search?: string;
  pagination?: {
    page: number;
    pageCount: number;
    totalCount: number;
    onPageChange: (page: number) => void;
  };
  selectedIds?: Set<string>;
  onToggleSelected?: (id: string, checked: boolean) => void;
  onToggleAll?: (checked: boolean) => void;
  onEditSemester: (semester: Semester) => void;
  onDeleteSemester: (semester: Semester) => void;
  onAddSemester?: () => void;
  highlightedSemesterId?: string | null;
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

export function SemesterList({
  semesters,
  isLoading,
  isDeleting,
  search,
  pagination,
  selectedIds,
  onToggleSelected,
  onToggleAll,
  onEditSemester,
  onDeleteSemester,
  onAddSemester,
  highlightedSemesterId,
}: SemesterListProps) {
  const semesterRows = Array.isArray(semesters) ? semesters : [];
  const selectedCount = semesterRows.filter((semester) => selectedIds?.has(semester.id)).length;
  const isAllSelected = semesterRows.length > 0 && selectedCount === semesterRows.length;
  const currentPage = pagination?.page ?? 1;
  const pageCount = pagination?.pageCount ?? 1;
  const totalCount = pagination?.totalCount ?? semesterRows.length;
  const { scrollRef, onScroll, virtualRows, topPadding, bottomPadding, isVirtualized, containerClassName, scrollToIndex } = useVirtualRows(semesterRows, { estimateRowHeight: 72 });
  const targetSemesterIndex = useMemo(
    () => semesterRows.findIndex((s) => s.id === highlightedSemesterId),
    [semesterRows, highlightedSemesterId]
  );
  useEffect(() => {
    if (targetSemesterIndex >= 0) scrollToIndex(targetSemesterIndex);
  }, [targetSemesterIndex, scrollToIndex]);

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
            Define academic terms, set planning windows, and align course offerings with each semester timeline.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-none bg-linear-to-br from-zinc-50 to-zinc-100/80 px-5 py-3 border border-zinc-200/60 shadow-sm">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Total Semesters</p>
            <p className="text-3xl font-bold tracking-tight text-zinc-950 mt-1">{totalCount}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={scrollRef} onScroll={onScroll} className={cn("overflow-x-auto", containerClassName)}>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-b border-zinc-200/60 hover:bg-transparent bg-zinc-50/40">
                {onToggleSelected && onToggleAll && (
                  <TableHead className="w-10 px-4 py-4 sm:px-6">
                    <RowSelectCheckbox label="Select all semesters" checked={isAllSelected} indeterminate={selectedCount > 0 && !isAllSelected} disabled={isDeleting || semesterRows.length === 0} onChange={onToggleAll} />
                  </TableHead>
                )}
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Name</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Status</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Start Date</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">End Date</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Total Offerings</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={onToggleSelected ? 7 : 6} className="p-0">
                    <TableSkeletonRows columns={onToggleSelected ? 7 : 6} rows={semesterRows.length > 0 ? semesterRows.length : 10} />
                  </TableCell>
                </TableRow>
              ) : semesterRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={onToggleSelected ? 7 : 6} className="p-0">
                    {search?.trim() ? (
                      <EmptyState
                        icon={CalendarRange}
                        title="No results found"
                        description={`No semesters match "${search.trim()}". Try a different search term.`}
                      />
                    ) : (
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
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                {isVirtualized && topPadding > 0 && (
                  <TableRow aria-hidden="true">
                    <TableCell colSpan={onToggleSelected ? 7 : 6} style={{ height: topPadding, padding: 0 }} />
                  </TableRow>
                )}
                {virtualRows.map(({ item: semester, index: idx }) => {
                  const offeringsCount = semester?.courseOfferings?.length ?? semester?.courseOfferingsCount ?? 0;

                  return (
                    <TableRow
                      key={semester.id}
                      data-semester-id={semester.id}
                      className={cn(
                        "border-b border-zinc-200/40 transition-all duration-200 hover:bg-zinc-50/60",
                        idx === semesterRows.length - 1 && "border-b-0"
                      )}
                    >
                      {onToggleSelected && (
                        <TableCell className="px-4 py-4 sm:px-6" onClick={(event) => event.stopPropagation()}>
                          <RowSelectCheckbox label={`Select ${semester.name}`} checked={selectedIds?.has(semester.id) ?? false} disabled={isDeleting} onChange={(checked) => onToggleSelected(semester.id, checked)} />
                        </TableCell>
                      )}
                      <TableCell className="px-4 py-4 sm:px-6">
                        <div className="font-semibold text-zinc-950 text-sm">{semester?.name ?? "Untitled"}</div>
                        {semester?.academicYear && (
                          <p className="text-xs text-zinc-500 mt-0.5">AY {semester.academicYear}</p>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6">
                        {semester?.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-none border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <Zap className="size-3 fill-emerald-500 text-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-none border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-500">
                            Upcoming
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6 text-sm text-zinc-700">
                        {formatDate(semester?.startDate)}
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6 text-sm text-zinc-700">
                        {formatDate(semester?.endDate)}
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6 text-right">
                        <span className="inline-flex items-center justify-center rounded-none bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700 min-w-10">
                          {offeringsCount}
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
                })}
                {isVirtualized && bottomPadding > 0 && (
                  <TableRow aria-hidden="true">
                    <TableCell colSpan={onToggleSelected ? 7 : 6} style={{ height: bottomPadding, padding: 0 }} />
                  </TableRow>
                )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200/60 px-4 py-3 sm:px-6">
            <p className="text-xs text-zinc-500">
              Page {currentPage} of {pageCount}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-none"
                onClick={() => pagination?.onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-none"
                onClick={() => pagination?.onPageChange(Math.min(pageCount, currentPage + 1))}
                disabled={currentPage >= pageCount}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
