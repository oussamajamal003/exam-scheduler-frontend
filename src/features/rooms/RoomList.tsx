import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Room } from "../../schemas/room";
import { Edit2, Trash2, MapPin } from "lucide-react";
import { cn } from "../../lib/utils";
import { TableSkeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/shared/EmptyState";

interface RoomListProps {
  rooms: Room[];
  isLoading?: boolean;
  isDeleting?: boolean;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
}

export function RoomList({ rooms, isLoading, isDeleting, onEditRoom, onDeleteRoom }: RoomListProps) {
  const roomRows = Array.isArray(rooms) ? rooms : [];

  if (isLoading) {
    return <TableSkeleton columns={5} rows={8} />;
  }

  return (
    <Card className="overflow-hidden rounded-none border border-zinc-200/80 bg-white/90 shadow-lg shadow-zinc-200/40">
      <CardHeader className="flex flex-col gap-4 border-b border-zinc-200/60 px-4 py-5 sm:px-6 sm:py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-none bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-sm shadow-zinc-950/10">
            Facilities
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">Rooms & Centers</CardTitle>
          <p className="text-sm leading-6 text-zinc-500 max-w-2xl">Allocate physical spaces, track maximum holding capacity, and align rooms strictly per examination center.</p>
        </div>
        <div className="flex items-center gap-2 rounded-none bg-linear-to-br from-zinc-50 to-zinc-100/80 px-5 py-3 border border-zinc-200/60 shadow-sm">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Total Rooms</p>
            <p className="text-3xl font-bold tracking-tight text-zinc-950 mt-1">{roomRows.length}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-b border-zinc-200/60 hover:bg-transparent bg-zinc-50/40">
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Room Name</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Center</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Capacity</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Status</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={MapPin}
                      title="No rooms found"
                      description="Configure spaces to generate functional exam schedules."
                      action={{
                        label: "Add Room",
                        onClick: () => {},
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                roomRows.map((room, idx) => (
                  <TableRow
                    key={room.id}
                    className={cn(
                      "border-b border-zinc-200/40 transition-all duration-200 hover:bg-zinc-50/60",
                      idx === roomRows.length - 1 && "border-b-0"
                    )}
                  >
                    <TableCell className="px-4 py-4 sm:px-6">
                      <span className="font-bold text-zinc-950 text-sm">{room.name}</span>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <span className="font-medium text-zinc-800 text-sm">{room.center}</span>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-sm font-semibold text-zinc-900">{room.capacity} <span className="text-zinc-500 font-normal">seats</span></TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider",
                        room.status === "Available" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {room.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditRoom(room)}
                          className="h-8 w-8 rounded-none text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors p-0 flex items-center justify-center"
                          title="Edit room"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => onDeleteRoom(room)}
                          className="h-8 w-8 rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors p-0 flex items-center justify-center disabled:opacity-50"
                          title="Delete room"
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
