import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Edit2,
  Eye,
  Layers,
  Trash2,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { TableSkeletonRows } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/shared/EmptyState";
import { RowSelectCheckbox } from "../../components/shared/BulkTableActions";
import { cn } from "../../lib/utils";
import { useVirtualRows } from "../../hooks/common/useVirtualRows";
import type { CourseOffering, OfferingStatus } from "../../schemas/courseOffering";

interface CourseOfferingListProps {
  offerings: CourseOffering[];
  isLoading?: boolean;
  isDeleting?: boolean;
  search?: string;
  selectedIds?: Set<string>;
  onToggleSelected?: (id: string, checked: boolean) => void;
  onToggleAll?: (checked: boolean) => void;
  onCreateOffering: () => void;
  onEditOffering: (offering: CourseOffering) => void;
  onViewOffering: (offering: CourseOffering) => void;
  onDeleteOffering: (offering: CourseOffering) => void;
  highlightedOfferingId?: string | null;
  /** Optional server-driven pagination. When provided, internal client paging is bypassed. */
  pagination?: {
    page: number; // 1-based
    pageCount: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
  };
}

const statusBadge = (status?: OfferingStatus) => {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";
    case "INACTIVE":
      return "bg-zinc-100 text-zinc-700";
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
};

export function CourseOfferingList({
  offerings,
  isLoading,
  isDeleting,
  search,
  selectedIds,
  onToggleSelected,
  onToggleAll,
  onCreateOffering,
  onEditOffering,
  onViewOffering,
  onDeleteOffering,
  highlightedOfferingId,
  pagination,
}: CourseOfferingListProps) {
  const rows = useMemo(
    () => (Array.isArray(offerings) ? offerings : []),
    [offerings]
  );
  const selectedCount = rows.filter((offering) => selectedIds?.has(offering.id)).length;
  const isAllSelected = rows.length > 0 && selectedCount === rows.length;

  const isServerPaged = Boolean(pagination);
  const CLIENT_PAGE_SIZE = 50;
  const [clientPage, setClientPage] = useState(0);
  const clientPageCount = Math.max(1, Math.ceil(rows.length / CLIENT_PAGE_SIZE));
  const safeClientPage = Math.min(clientPage, clientPageCount - 1);
  const clientPagedRows = useMemo(
    () => rows.slice(safeClientPage * CLIENT_PAGE_SIZE, safeClientPage * CLIENT_PAGE_SIZE + CLIENT_PAGE_SIZE),
    [rows, safeClientPage]
  );
  const pagedRows = isServerPaged ? rows : clientPagedRows;
  const totalCount = pagination?.totalCount ?? rows.length;
  const pageSize = pagination?.pageSize ?? CLIENT_PAGE_SIZE;
  const pageCount = pagination?.pageCount ?? clientPageCount;
  const currentPage = pagination ? pagination.page : safeClientPage + 1;
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(totalCount, currentPage * pageSize);
  const showPagination = isServerPaged ? pageCount > 1 : rows.length > CLIENT_PAGE_SIZE;
  const { scrollRef, onScroll, virtualRows, topPadding, bottomPadding, isVirtualized, containerClassName, scrollToIndex } = useVirtualRows(pagedRows, { estimateRowHeight: 92 });
  const targetOfferingIndex = useMemo(
    () => pagedRows.findIndex((o) => o.id === highlightedOfferingId),
    [pagedRows, highlightedOfferingId]
  );
  useEffect(() => {
    if (targetOfferingIndex >= 0) scrollToIndex(targetOfferingIndex);
  }, [targetOfferingIndex, scrollToIndex]);

  return (
    <Card className="overflow-hidden rounded-none border border-zinc-200/80 bg-white/90 shadow-lg shadow-zinc-200/40">
      <CardHeader className="flex flex-col gap-4 border-b border-zinc-200/60 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-none bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-sm shadow-zinc-950/10">
            Catalog
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            Course Offerings
          </CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-zinc-500">
            Browse semester sections, instructor assignments, enrollment counts, and exam readiness in one relational table.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-none border border-zinc-200/60 bg-linear-to-br from-zinc-50 to-zinc-100/80 px-5 py-3 shadow-sm">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
              Total Offerings
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
              {totalCount}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div ref={scrollRef} onScroll={onScroll} className={cn("overflow-x-auto", containerClassName)}>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-b border-zinc-200/60 bg-zinc-50/40 hover:bg-transparent">
                {onToggleSelected && onToggleAll && (
                  <TableHead className="w-10 px-4 py-4 sm:px-6">
                    <RowSelectCheckbox label="Select all course offerings" checked={isAllSelected} indeterminate={selectedCount > 0 && !isAllSelected} disabled={isDeleting || rows.length === 0} onChange={onToggleAll} />
                  </TableHead>
                )}
                <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Course
                </TableHead>
                <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Code
                </TableHead>
                <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Credits
                </TableHead>
                <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Instructor
                </TableHead>
                <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Schedule
                </TableHead>
                <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Semester
                </TableHead>
                <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Program
                </TableHead>
                <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Capacity
                </TableHead>
                <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Enrolled
                </TableHead>
                <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Exams
                </TableHead>
                <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Status
                </TableHead>
                <TableHead className="px-4 py-4 text-right text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={onToggleSelected ? 13 : 12} className="p-0">
                    <TableSkeletonRows columns={onToggleSelected ? 13 : 12} rows={rows.length > 0 ? rows.length : 10} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={onToggleSelected ? 13 : 12} className="p-0">
                    {search?.trim() ? (
                      <EmptyState
                        icon={Layers}
                        title="No results found"
                        description={`No course offerings match "${search.trim()}". Try a different search term.`}
                      />
                    ) : (
                      <EmptyState
                        icon={Layers}
                        title="No course offerings yet"
                        description="Create your first offering to connect courses, semesters, instructors, and enrollments."
                        action={{
                          label: "Add Offering",
                          onClick: onCreateOffering,
                        }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                {isVirtualized && topPadding > 0 && (
                  <TableRow aria-hidden="true">
                    <TableCell colSpan={onToggleSelected ? 13 : 12} style={{ height: topPadding, padding: 0 }} />
                  </TableRow>
                )}
                {virtualRows.map(({ item: offering, index }) => (
                  (() => {
                    const registrationCount =
                      offering.enrollments?.length ??
                      offering.registrationsCount ??
                      0;
                    const examsCount = offering.exams?.length ?? offering.examsCount ?? 0;
                    const isProjectOffering = offering.courseType === "PROJECT" || offering.hasExam === false;

                    return (
                  <TableRow
                    key={offering.id}
                    data-course-offering-id={offering.id}
                    className={cn(
                      "cursor-pointer border-b border-zinc-200/40 transition-all duration-200 hover:bg-zinc-50/60 focus-visible:bg-zinc-50/60 focus-visible:outline-none",
                      index === pagedRows.length - 1 && "border-b-0"
                    )}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open details for ${offering.course?.title ?? offering.course?.name ?? offering.course?.code ?? "course offering"}`}
                    onClick={() => onViewOffering(offering)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onViewOffering(offering);
                      }
                    }}
                  >
                    {onToggleSelected && (
                      <TableCell className="px-4 py-4 sm:px-6" onClick={(event) => event.stopPropagation()}>
                        <RowSelectCheckbox label={`Select ${offering.course?.code ?? "course offering"}`} checked={selectedIds?.has(offering.id) ?? false} disabled={isDeleting} onChange={(checked) => onToggleSelected(offering.id, checked)} />
                      </TableCell>
                    )}
                    <TableCell className="px-4 py-4 sm:px-6">
                      <div className="font-semibold text-zinc-950">
                        {offering.course?.title ?? offering.course?.name ?? "Untitled course"}
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {offering.section ? `Section ${offering.section}` : "Default section"}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <span className="font-bold text-zinc-950">
                        {offering.course?.code ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-zinc-700 sm:px-6">
                      {offering.credits ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-zinc-700 sm:px-6">
                      {offering.instructor ?? "Unassigned"}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-zinc-700 sm:px-6">
                      <div className="flex flex-col">
                        <span className="font-medium">{offering.day ?? "—"}</span>
                        {(offering.time || offering.endTime) && (
                          <span className="text-xs text-zinc-500">
                            {offering.time && offering.endTime
                              ? `${offering.time} - ${offering.endTime}`
                              : offering.time ?? offering.endTime ?? ""}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-zinc-700 sm:px-6">
                      {offering.semester?.name ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-zinc-700 sm:px-6">
                      {offering.program?.name ?? offering.course?.program?.name ?? "Unassigned"}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-zinc-700 sm:px-6">
                      {offering.capacity !== null && offering.capacity !== undefined ? (
                        <span className="font-semibold text-zinc-950">{offering.capacity}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <span className="inline-flex items-center rounded-none bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        <Users className="mr-1.5 size-3.5" />
                        {registrationCount}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <span className={cn(
                        "inline-flex items-center rounded-none px-2.5 py-1 text-xs font-semibold",
                        isProjectOffering ? "bg-zinc-100 text-zinc-600" : "bg-amber-50 text-amber-700"
                      )}>
                        <ClipboardList className="mr-1.5 size-3.5" />
                        {isProjectOffering ? "No exam" : examsCount}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-none px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
                          statusBadge(offering.status)
                        )}
                      >
                        {offering.status ?? "ACTIVE"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right sm:px-6">
                      <div className="flex items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewOffering(offering)}
                          className="h-8 rounded-none text-xs font-semibold text-zinc-600 transition-colors hover:bg-blue-100/50 hover:text-blue-700"
                        >
                          <Eye className="mr-1.5 size-3.5" />
                          Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditOffering(offering)}
                          className="flex h-8 w-8 items-center justify-center rounded-none p-0 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                          title="Edit offering"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => onDeleteOffering(offering)}
                          className="flex h-8 w-8 items-center justify-center rounded-none p-0 text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                          title="Delete offering"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                    );
                  })()
                ))
                }
                {isVirtualized && bottomPadding > 0 && (
                  <TableRow aria-hidden="true">
                    <TableCell colSpan={onToggleSelected ? 13 : 12} style={{ height: bottomPadding, padding: 0 }} />
                  </TableRow>
                )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
        {showPagination && (
          <div className="flex items-center justify-between gap-3 border-t border-zinc-200/60 bg-zinc-50/40 px-4 py-3 text-xs text-zinc-600 sm:px-6">
            <p>
              Showing <span className="font-semibold text-zinc-900">{rangeStart}</span>–
              <span className="font-semibold text-zinc-900">{rangeEnd}</span> of
              <span className="font-semibold text-zinc-900"> {totalCount}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => {
                  if (pagination) pagination.onPageChange(Math.max(1, currentPage - 1));
                  else setClientPage((p) => Math.max(0, p - 1));
                }}
                className="h-8 rounded-none px-2"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="font-semibold text-zinc-900">
                Page {currentPage} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= pageCount}
                onClick={() => {
                  if (pagination) pagination.onPageChange(Math.min(pageCount, currentPage + 1));
                  else setClientPage((p) => Math.min(clientPageCount - 1, p + 1));
                }}
                className="h-8 rounded-none px-2"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
