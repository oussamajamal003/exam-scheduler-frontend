import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Card, CardContent } from "../../components/ui/card";
import { useCenter } from "../../hooks/centers/useCenters";
import { Center } from "../../schemas/center";
import { Building2, DoorOpen, MapPin, ShieldCheck, UserCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { getApiErrorMessage } from "../../lib/apiError";

interface CenterDetailDialogProps {
  center: Center | null;
  open: boolean;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MAINTENANCE: "bg-amber-50 text-amber-700 border-amber-200",
};

export function CenterDetailDialog({ center, open, onClose }: CenterDetailDialogProps) {
  const { data: detail, isLoading, isError, error } = useCenter(open ? center?.id : undefined);
  const view = detail ?? center;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-zinc-600" />
            {view?.name ?? "Center Details"}
          </DialogTitle>
        </DialogHeader>

        {isLoading && <PageSpinner label="Loading center details" className="min-h-40" />}

        {isError && (
          <div className="rounded-none border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive">
            {getApiErrorMessage(error, "Failed to load center details.")}
          </div>
        )}

        {view && !isLoading && !isError && (
          <div className="space-y-6 mt-2">
            {/* Header summary */}
            <Card className="rounded-none border border-zinc-200/60 bg-linear-to-br from-zinc-50 to-white">
              <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">Location</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-950 inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-zinc-400" />
                    {view.location ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">Total Rooms</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-950">
                    {view.rooms?.length ?? view.roomsCount ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">Supervisors</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-950">
                    {view.supervisors?.length ?? view.supervisorsCount ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Rooms section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-zinc-700">
                  <DoorOpen className="size-4" /> Rooms
                </h3>
                <span className="text-xs text-zinc-500">{view.rooms?.length ?? view.roomsCount ?? 0} total</span>
              </div>
              {view.rooms && view.rooms.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {view.rooms.map((room) => (
                    <Card key={room.id} className="rounded-none border border-zinc-200/70 bg-white hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-zinc-950">{room.name}</p>
                          {room.status && (
                            <span
                              className={cn(
                                "inline-flex items-center rounded-none border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                                STATUS_STYLES[room.status.toUpperCase()] ?? "bg-zinc-100 text-zinc-600 border-zinc-200"
                              )}
                            >
                              {room.status}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">
                          Capacity:{" "}
                          <span className="font-semibold text-zinc-700">{room.capacity ?? "—"}</span>
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-none border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-6 text-center text-xs text-zinc-500">
                  No rooms assigned to this center yet.
                </div>
              )}
            </section>

            {/* Supervisors section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-zinc-700">
                  <ShieldCheck className="size-4" /> Supervisors
                </h3>
                <span className="text-xs text-zinc-500">{view.supervisors?.length ?? view.supervisorsCount ?? 0} total</span>
              </div>
              {view.supervisors && view.supervisors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {view.supervisors.map((sup) => (
                    <Card key={sup.id} className="rounded-none border border-zinc-200/70 bg-white hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="rounded-none bg-zinc-100 p-2">
                          <UserCircle2 className="size-5 text-zinc-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-950 truncate">{sup.name ?? "Unnamed"}</p>
                          {sup.email && <p className="text-xs text-zinc-500 truncate">{sup.email}</p>}
                          {sup.department && (
                            <p className="text-[11px] text-zinc-400 mt-0.5">{sup.department}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-none border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-6 text-center text-xs text-zinc-500">
                  No supervisors assigned to this center yet.
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
