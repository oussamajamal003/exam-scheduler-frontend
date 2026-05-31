import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardList, Trash2, Users } from "lucide-react";
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
import type { Enrollment } from "../../schemas/enrollment";

interface EnrollmentListProps {
  enrollments: Enrollment[];
  isLoading?: boolean;
  isDeleting?: boolean;
  search?: string;
  selectedIds?: Set<string>;
  onToggleSelected?: (id: string, checked: boolean) => void;
  onToggleAll?: (checked: boolean) => void;
  onCreate: () => void;
  onDelete: (enrollment: Enrollment) => void;
  highlightedEnrollmentId?: string | null;
  /** Optional server-driven pagination. When provided, internal client paging is bypassed. */
  pagination?: {
    page: number; // 1-based
    pageCount: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
  };
}

const statusBadge = (status?: string | null) => {
  switch ((status ?? "ACTIVE").toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "DROPPED":
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    case "COMPLETED":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
};

export function EnrollmentList({
  enrollments,
  isLoading,
  isDeleting,
  search,
  selectedIds,
  onToggleSelected,
  onToggleAll,
  onCreate,
  onDelete,
  highlightedEnrollmentId,
  pagination,
}: EnrollmentListProps) {
  const rows = useMemo(
    () => (Array.isArray(enrollments) ? enrollments : []),
    [enrollments]
  );
  const selectedCount = rows.filter((enrollment) => selectedIds?.has(enrollment.id)).length;
  const isAllSelected = rows.length > 0 && selectedCount === rows.length;

  const isServerPaged = Boolean(pagination);
  // Client pagination fallback (only used when no server pagination provided)
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
  const currentPage = pagination ? pagination.page : safeClientPage + 1; // 1-based for display
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(totalCount, currentPage * pageSize);
  const showPagination = isServerPaged ? pageCount > 1 : rows.length > CLIENT_PAGE_SIZE;
  const { scrollRef, onScroll, virtualRows, topPadding, bottomPadding, isVirtualized, containerClassName, scrollToIndex } = useVirtualRows(pagedRows, { estimateRowHeight: 84 });
  const targetEnrollmentIndex = useMemo(
    () => pagedRows.findIndex((e) => e.id === highlightedEnrollmentId),
    [pagedRows, highlightedEnrollmentId]
  );
  useEffect(() => {
    if (targetEnrollmentIndex >= 0) scrollToIndex(targetEnrollmentIndex);
  }, [targetEnrollmentIndex, scrollToIndex]);

  return (
    <Card className="overflow-hidden rounded-none border border-zinc-200/80 bg-white/90 shadow-lg shadow-zinc-200/40">
      <CardHeader className="flex flex-col gap-4 border-b border-zinc-200/60 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-none bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-sm shadow-zinc-950/10">
            Registrations
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            Student Enrollments
          </CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-zinc-500">
            Real-time view of every student–course offering registration with full
            program and semester context.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-none border border-zinc-200/60 bg-linear-to-br from-zinc-50 to-zinc-100/80 px-5 py-3 shadow-sm">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
              Total Enrollments
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
                    <RowSelectCheckbox label="Select all enrollments" checked={isAllSelected} indeterminate={selectedCount > 0 && !isAllSelected} disabled={isDeleting || rows.length === 0} onChange={onToggleAll} />
                  </TableHead>
                )}
                <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Student
                </TableHead>
                <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Course Offering
                </TableHead>
                <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Code
                </TableHead>
                <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Program
                </TableHead>
                <TableHead className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-600 sm:px-6">
                  Semester
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
                  <TableCell colSpan={onToggleSelected ? 8 : 7} className="p-0">
                    <TableSkeletonRows columns={onToggleSelected ? 8 : 7} rows={rows.length > 0 ? rows.length : 10} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={onToggleSelected ? 8 : 7} className="p-0">
                    {search?.trim() ? (
                      <EmptyState
                        icon={ClipboardList}
                        title="No results found"
                        description={`No enrollments match "${search.trim()}". Try a different search term.`}
                      />
                    ) : (
                      <EmptyState
                        icon={ClipboardList}
                        title="No enrollments yet"
                        description="Add the first enrollment or import a CSV to connect students with course offerings."
                        action={{ label: "Add Enrollment", onClick: onCreate }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                {isVirtualized && topPadding > 0 && (
                  <TableRow aria-hidden="true">
                    <TableCell colSpan={onToggleSelected ? 8 : 7} style={{ height: topPadding, padding: 0 }} />
                  </TableRow>
                )}
                {virtualRows.map(({ item: enrollment, index }) => (
                  <TableRow
                    key={enrollment.id}
                    data-enrollment-id={enrollment.id}
                    className={cn(
                      "border-b border-zinc-200/40 transition-all duration-200 hover:bg-zinc-50/60",
                      index === pagedRows.length - 1 && "border-b-0"
                    )}
                  >
                    {onToggleSelected && (
                      <TableCell className="px-4 py-4 sm:px-6" onClick={(event) => event.stopPropagation()}>
                        <RowSelectCheckbox label={`Select ${enrollment.student?.fullName ?? enrollment.student?.user?.name ?? "enrollment"}`} checked={selectedIds?.has(enrollment.id) ?? false} disabled={isDeleting} onChange={(checked) => onToggleSelected(enrollment.id, checked)} />
                      </TableCell>
                    )}
                    <TableCell className="px-4 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-none bg-zinc-100 text-xs font-bold text-zinc-700">
                          {(
                            enrollment.student?.fullName?.[0] ??
                            enrollment.student?.user?.name?.[0] ??
                            "?"
                          ).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-zinc-950">
                            {enrollment.student?.fullName ?? enrollment.student?.user?.name ?? "Unknown student"}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-zinc-500">
                            {enrollment.student?.user?.email ??
                              enrollment.student?.universityId ??
                              "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <div className="font-semibold text-zinc-950">
                        {enrollment.courseOffering?.course?.title ?? enrollment.courseOffering?.course?.name ?? "Untitled course"}
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {enrollment.courseOffering?.section
                          ? `Section ${enrollment.courseOffering.section}`
                          : "Default section"}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <span className="font-bold text-zinc-950">
                        {enrollment.courseOffering?.course?.code ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-zinc-700 sm:px-6">
                      {enrollment.program?.name ?? enrollment.courseOffering?.program?.name ?? enrollment.courseOffering?.course?.program?.name ?? "Unassigned"}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-zinc-700 sm:px-6">
                      {enrollment.semester?.name ?? enrollment.courseOffering?.semester?.name ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-none px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
                          statusBadge(enrollment.status)
                        )}
                      >
                        <Users className="mr-1.5 size-3" />
                        {enrollment.status ?? "ACTIVE"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right sm:px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => onDelete(enrollment)}
                          className="flex h-8 w-8 items-center justify-center rounded-none p-0 text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                          title="Remove enrollment"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {isVirtualized && bottomPadding > 0 && (
                  <TableRow aria-hidden="true">
                    <TableCell colSpan={onToggleSelected ? 8 : 7} style={{ height: bottomPadding, padding: 0 }} />
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
