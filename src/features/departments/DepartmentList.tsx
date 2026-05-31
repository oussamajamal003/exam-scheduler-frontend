import { useEffect, useMemo } from 'react';
import { BookOpen, Edit2, Eye, Layers, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeletonRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { RowSelectCheckbox } from '@/components/shared/BulkTableActions';
import { cn } from '@/lib/utils';
import { useVirtualRows } from '@/hooks/common/useVirtualRows';
import type { Program } from '@/schemas/program';

interface DepartmentListProps {
  programs: Program[];
  isLoading?: boolean;
  isDeleting?: boolean;
  search?: string;
  selectedIds?: Set<string>;
  onToggleSelected?: (id: string, checked: boolean) => void;
  onToggleAll?: (checked: boolean) => void;
  onEditProgram: (program: Program) => void;
  onDeleteProgram: (program: Program) => void;
  onViewProgram: (program: Program) => void;
  onCreateProgram: () => void;
  highlightedProgramId?: string | null;
}

const formatDate = (value?: string) => {
  if (!value) return 'Recently added';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently added';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export function DepartmentList({
  programs,
  isLoading,
  isDeleting,
  search,
  selectedIds,
  onToggleSelected,
  onToggleAll,
  onEditProgram,
  onDeleteProgram,
  onViewProgram,
  onCreateProgram,
  highlightedProgramId,
}: DepartmentListProps) {
  const programRows = Array.isArray(programs) ? programs : [];
  const selectedCount = programRows.filter((program) => program.id && selectedIds?.has(program.id)).length;
  const isAllSelected = programRows.length > 0 && selectedCount === programRows.length;
  const { scrollRef, onScroll, virtualRows, topPadding, bottomPadding, isVirtualized, containerClassName, scrollToIndex } = useVirtualRows(programRows, { estimateRowHeight: 76 });
  const targetProgramIndex = useMemo(
    () => programRows.findIndex((p) => p.id === highlightedProgramId),
    [programRows, highlightedProgramId]
  );
  useEffect(() => {
    if (targetProgramIndex >= 0) scrollToIndex(targetProgramIndex);
  }, [targetProgramIndex, scrollToIndex]);

  return (
    <Card className="overflow-hidden rounded-none border border-zinc-200/80 bg-white/90 shadow-lg shadow-zinc-200/40">
      <CardHeader className="flex flex-col gap-4 border-b border-zinc-200/60 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-none bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-sm shadow-zinc-950/10">
            Directory
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">Programs / Departments</CardTitle>
          <p className="text-sm leading-6 text-zinc-500 max-w-2xl">
            Browse relational program data, review department ownership, and track course totals with a polished responsive table.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-none bg-linear-to-br from-zinc-50 to-zinc-100/80 px-5 py-3 border border-zinc-200/60 shadow-sm">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Total Programs</p>
            <p className="text-3xl font-bold tracking-tight text-zinc-950 mt-1">{programRows.length}</p>
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
                    <RowSelectCheckbox label="Select all programs" checked={isAllSelected} indeterminate={selectedCount > 0 && !isAllSelected} disabled={isDeleting || programRows.length === 0} onChange={onToggleAll} />
                  </TableHead>
                )}
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Program Name</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Code</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Department Name</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Total Courses</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Created At</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={onToggleSelected ? 7 : 6} className="p-0">
                    <TableSkeletonRows columns={onToggleSelected ? 7 : 6} rows={programRows.length > 0 ? programRows.length : 10} />
                  </TableCell>
                </TableRow>
              ) : programRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={onToggleSelected ? 7 : 6} className="p-0">
                    {search?.trim() ? (
                      <EmptyState
                        icon={Layers}
                        title="No results found"
                        description={`No programs match "${search.trim()}". Try a different search term.`}
                      />
                    ) : (
                      <EmptyState
                        icon={Layers}
                        title="No programs yet"
                        description="Create your first program to connect departments and course coverage in one polished workflow."
                        action={{
                          label: 'Add Program',
                          onClick: onCreateProgram,
                        }}
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
                {virtualRows.map(({ item: program, index }) => (
                  <TableRow
                    key={program.id}
                    data-program-id={program.id}
                    className={cn(
                      'border-b border-zinc-200/40 transition-all duration-200 hover:bg-zinc-50/60',
                      index === programRows.length - 1 && 'border-b-0'
                    )}
                  >
                    {onToggleSelected && (
                      <TableCell className="px-4 py-4 sm:px-6" onClick={(event) => event.stopPropagation()}>
                        <RowSelectCheckbox label={`Select ${program.name}`} checked={program.id ? selectedIds?.has(program.id) ?? false : false} disabled={isDeleting} onChange={(checked) => program.id && onToggleSelected(program.id, checked)} />
                      </TableCell>
                    )}
                    <TableCell className="px-4 py-4 sm:px-6">
                      <div>
                        <div className="font-semibold text-zinc-950 text-sm">{program.name}</div>
                        <p className="text-xs text-zinc-500 mt-0.5">Program record</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <span className="font-bold text-zinc-950 text-sm">{program.code}</span>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <div className="text-sm font-medium text-zinc-800">{program.department?.name ?? 'Unassigned Department'}</div>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <div className="inline-flex items-center rounded-none bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <BookOpen className="mr-1.5 size-3.5" />
                        {program.courses?.length ?? program.totalCourses ?? 0} Courses
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-sm text-zinc-600">{formatDate(program.createdAt)}</TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewProgram(program)}
                          className="h-8 rounded-none text-xs font-semibold text-zinc-600 hover:bg-blue-100/50 hover:text-blue-700 transition-colors"
                        >
                          <Eye className="size-3.5 mr-1.5" />
                          Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditProgram(program)}
                          className="h-8 w-8 rounded-none text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors p-0 flex items-center justify-center"
                          title="Edit program"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => onDeleteProgram(program)}
                          className="h-8 w-8 rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors p-0 flex items-center justify-center disabled:opacity-50"
                          title="Delete program"
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
      </CardContent>
    </Card>
  );
}