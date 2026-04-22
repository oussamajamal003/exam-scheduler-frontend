import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Center } from "../../schemas/center";
import { Building2, Edit2, Eye, MapPin, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { TableSkeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/shared/EmptyState";

interface CenterListProps {
  centers: Center[];
  isLoading?: boolean;
  isDeleting?: boolean;
  onEditCenter: (center: Center) => void;
  onDeleteCenter: (center: Center) => void;
  onViewCenter: (center: Center) => void;
  onAddCenter?: () => void;
}

export function CenterList({
  centers,
  isLoading,
  isDeleting,
  onEditCenter,
  onDeleteCenter,
  onViewCenter,
  onAddCenter,
}: CenterListProps) {
  const rows = Array.isArray(centers) ? centers : [];

  if (isLoading) {
    return <TableSkeleton columns={5} rows={8} />;
  }

  return (
    <Card className="overflow-hidden rounded-none border border-zinc-200/80 bg-white/90 shadow-lg shadow-zinc-200/40">
      <CardHeader className="flex flex-col gap-4 border-b border-zinc-200/60 px-4 py-5 sm:px-6 sm:py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-none bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-sm shadow-zinc-950/10">
            Resource Layer
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
            Center Management
          </CardTitle>
          <p className="text-sm leading-6 text-zinc-500 max-w-2xl">
            Manage exam centers, their rooms, and supervisor assignments across the institution.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-none bg-linear-to-br from-zinc-50 to-zinc-100/80 px-5 py-3 border border-zinc-200/60 shadow-sm">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Total Centers</p>
            <p className="text-3xl font-bold tracking-tight text-zinc-950 mt-1">{rows.length}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-b border-zinc-200/60 hover:bg-transparent bg-zinc-50/40">
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Name</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Location</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Total Rooms</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Supervisors</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={Building2}
                      title="No centers yet"
                      description="Add your first exam center to start allocating rooms and supervisors."
                      action={onAddCenter ? { label: "Add Center", onClick: onAddCenter } : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((center, idx) => (
                  <TableRow
                    key={center.id}
                    onClick={() => onViewCenter(center)}
                    className={cn(
                      "border-b border-zinc-200/40 transition-all duration-200 hover:bg-zinc-50/60 cursor-pointer",
                      idx === rows.length - 1 && "border-b-0"
                    )}
                  >
                    <TableCell className="px-4 py-4 sm:px-6">
                      <div className="font-semibold text-zinc-950 text-sm">{center?.name ?? "Untitled"}</div>
                      {center?.code && (
                        <p className="text-xs text-zinc-500 mt-0.5 font-mono">{center.code}</p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-sm text-zinc-700">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-zinc-400" />
                        {center?.location ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-right">
                      <span className="inline-flex items-center justify-center rounded-none bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-bold min-w-[2.5rem]">
                        {center?.roomsCount ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-right">
                      <span className="inline-flex items-center justify-center rounded-none bg-violet-50 text-violet-700 px-2.5 py-1 text-xs font-bold min-w-[2.5rem]">
                        {center?.supervisorsCount ?? 0}
                      </span>
                    </TableCell>
                    <TableCell
                      className="px-4 py-4 sm:px-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewCenter(center)}
                          className="h-8 w-8 rounded-none text-zinc-600 hover:bg-blue-100/50 hover:text-blue-700 transition-colors p-0 flex items-center justify-center"
                          title="View details"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditCenter(center)}
                          className="h-8 w-8 rounded-none text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors p-0 flex items-center justify-center"
                          title="Edit center"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => onDeleteCenter(center)}
                          className="h-8 w-8 rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors p-0 flex items-center justify-center disabled:opacity-50"
                          title="Delete center"
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
