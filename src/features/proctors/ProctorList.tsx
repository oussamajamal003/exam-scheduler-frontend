import { useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Proctor } from "../../schemas/proctor";
import { Edit2, Trash2, ShieldAlert } from "lucide-react";
import { cn } from "../../lib/utils";
import { TableSkeletonRows } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/shared/EmptyState";
import { RowSelectCheckbox } from "../../components/shared/BulkTableActions";
import { useVirtualRows } from "../../hooks/common/useVirtualRows";

const formatTimeSlotLabel = (slot: NonNullable<Proctor["availableTimeSlots"]>[number]) => {
  const date = slot.date || slot.startTime;
  const day = date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })
    : "Unknown day";
  const start = new Date(slot.startTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });

  return `${day} ${start}`;
};

interface ProctorListProps {
  proctors: Proctor[];
  isLoading?: boolean;
  isDeleting?: boolean;
  search?: string;
  highlightedProctorId?: string | null;
  pagination?: {
    page: number;
    pageCount: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
  };
  selectedIds?: Set<string>;
  onToggleSelected?: (id: string, checked: boolean) => void;
  onToggleAll?: (checked: boolean) => void;
  onAdd?: () => void;
  onEditProctor: (proctor: Proctor) => void;
  onViewWorkload: (proctor: Proctor) => void;
  onDeleteProctor: (proctor: Proctor) => void;
}

export function ProctorList({ proctors, isLoading, isDeleting, search, highlightedProctorId, pagination, selectedIds, onToggleSelected, onToggleAll, onAdd, onEditProctor, onViewWorkload, onDeleteProctor }: ProctorListProps) {
  const proctorRows = Array.isArray(proctors) ? proctors : [];
  const selectedCount = proctorRows.filter((proctor) => proctor.id && selectedIds?.has(proctor.id)).length;
  const isAllSelected = proctorRows.length > 0 && selectedCount === proctorRows.length;
  const totalCount = pagination?.totalCount ?? proctorRows.length;
  const { scrollRef, onScroll, virtualRows, topPadding, bottomPadding, isVirtualized, containerClassName, scrollToIndex } = useVirtualRows(proctorRows, { estimateRowHeight: 96 });
  const targetProctorIndex = useMemo(
    () => proctorRows.findIndex((p) => p.id === highlightedProctorId),
    [proctorRows, highlightedProctorId]
  );
  useEffect(() => {
    if (targetProctorIndex >= 0) scrollToIndex(targetProctorIndex);
  }, [targetProctorIndex, scrollToIndex]);

  return (
    <Card className="overflow-hidden rounded-none border border-zinc-200/80 bg-white/90 shadow-lg shadow-zinc-200/40">
      <CardHeader className="flex flex-col gap-4 border-b border-zinc-200/60 px-4 py-5 sm:px-6 sm:py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-none bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-sm shadow-zinc-950/10">
            Directory
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">Proctors</CardTitle>
          <p className="text-sm leading-6 text-zinc-500 max-w-2xl">Manage examinee proctors, track workloads, and manage availability efficiently.</p>
        </div>
        <div className="flex items-center gap-2 rounded-none bg-linear-to-br from-zinc-50 to-zinc-100/80 px-5 py-3 border border-zinc-200/60 shadow-sm">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Total Staff</p>
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
                    <RowSelectCheckbox
                      label="Select all proctors"
                      checked={isAllSelected}
                      indeterminate={selectedCount > 0 && !isAllSelected}
                      disabled={isDeleting || proctorRows.length === 0}
                      onChange={onToggleAll}
                    />
                  </TableHead>
                )}
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Name</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Email</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 inline-flex sm:table-cell">Department</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Availability</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Workload</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={onToggleSelected ? 7 : 6} className="p-0">
                    <TableSkeletonRows columns={onToggleSelected ? 7 : 6} rows={proctorRows.length > 0 ? proctorRows.length : 10} />
                  </TableCell>
                </TableRow>
              ) : proctorRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={onToggleSelected ? 7 : 6} className="p-0">
                    {search?.trim() ? (
                      <EmptyState
                        icon={ShieldAlert}
                        title="No results found"
                        description={`No proctors match "${search.trim()}". Try a different search term.`}
                      />
                    ) : (
                      <EmptyState
                        icon={ShieldAlert}
                        title="No proctors yet"
                        description="Add a proctor record to start assigning workloads."
                        action={onAdd ? { label: "Add Proctor", onClick: onAdd } : undefined}
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
                {virtualRows.map(({ item: sup, index: idx }) => (
                  <TableRow
                    key={sup.id}
                    data-proctor-id={sup.id}
                    className={cn(
                      "border-b border-zinc-200/40 transition-all duration-200 hover:bg-zinc-50/60",
                      // gold animation applied via useHighlightRow hook
                      idx === proctorRows.length - 1 && "border-b-0"
                    )}
                  >
                    {onToggleSelected && (
                      <TableCell className="px-4 py-4 sm:px-6" onClick={(event) => event.stopPropagation()}>
                        <RowSelectCheckbox
                          label={`Select ${sup.user?.name ?? sup.name}`}
                          checked={sup.id ? selectedIds?.has(sup.id) ?? false : false}
                          disabled={isDeleting}
                          onChange={(checked) => sup.id && onToggleSelected(sup.id, checked)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="px-4 py-4 sm:px-6">
                      <div className="font-semibold text-zinc-950 text-sm">{sup.user?.name ?? sup.name}</div>
                      <p className="text-xs text-zinc-500 mt-0.5">Active</p>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-sm text-zinc-600">{sup.user?.email ?? sup.email}</TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <div className="font-medium text-zinc-900 text-sm">{sup.department}</div>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-zinc-900">
                          {sup.availableTimeSlots?.length ?? 0} slot{(sup.availableTimeSlots?.length ?? 0) === 1 ? "" : "s"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(sup.availableTimeSlots ?? []).slice(0, 2).map((slot) => (
                            <Badge key={slot.id} variant="secondary" className="rounded-none normal-case tracking-normal">
                              {formatTimeSlotLabel(slot)}
                            </Badge>
                          ))}
                          {(sup.availableTimeSlots?.length ?? 0) > 2 && (
                            <Badge variant="default" className="rounded-none normal-case tracking-normal">
                              +{(sup.availableTimeSlots?.length ?? 0) - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewWorkload(sup)}
                        className="h-8 rounded-none text-xs font-semibold text-zinc-600 hover:bg-indigo-100/50 hover:text-indigo-700 transition-colors"
                      >
                        <ShieldAlert className="size-3.5 mr-1.5" />
                        View Workload
                      </Button>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditProctor(sup)}
                          className="h-8 w-8 rounded-none text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors p-0 flex items-center justify-center"
                          title="Edit proctor"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => onDeleteProctor(sup)}
                          className="h-8 w-8 rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors p-0 flex items-center justify-center disabled:opacity-50"
                          title="Delete proctor"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
        {pagination && pagination.pageCount > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-zinc-200/60 px-4 py-3 text-sm sm:px-6">
            <span className="text-xs font-medium text-zinc-500">
              Page {pagination.page} of {pagination.pageCount} • {pagination.totalCount} proctors
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-none"
                disabled={isLoading || pagination.page <= 1}
                onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-none"
                disabled={isLoading || pagination.page >= pagination.pageCount}
                onClick={() => pagination.onPageChange(Math.min(pagination.pageCount, pagination.page + 1))}
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
