import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roomSchema, Room } from "../../schemas/room";
import { useCenters } from "../../hooks/centers/useCenters";
import { useRooms } from "../../hooks/rooms/useRooms";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { AlertCircle, CheckCircle2, Building2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface RoomFormProps {
  initialData?: Room;
  onSubmit: (data: Room) => void;
  isLoading?: boolean;
  submitErrorMessage?: string | null;
  submitValidationMessages?: Record<string, string[]> | null;
}

export function RoomForm({ initialData, onSubmit, isLoading, submitErrorMessage, submitValidationMessages }: RoomFormProps) {
  const { data: centers = [], isLoading: centersLoading } = useCenters();
  const { data: rooms = [] } = useRooms();

  const form = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      centerId: initialData?.centerId ?? "",
      centerName: initialData?.centerName ?? "",
      capacity: initialData?.capacity ?? (undefined as unknown as number),
      status: (initialData?.status ?? "Available") as "Available" | "Maintenance",
    },
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({
      name: initialData?.name ?? "",
      centerId: initialData?.centerId ?? "",
      centerName: initialData?.centerName ?? "",
      capacity: initialData?.capacity ?? (undefined as unknown as number),
      status: (initialData?.status ?? "Available") as "Available" | "Maintenance",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id]);

  const hasErrors = Object.keys(form.formState.errors).length > 0;
  const roomName = form.watch("name");
  const duplicateRoom = rooms.find(
    (room) =>
      room.id !== initialData?.id &&
      (room.name ?? "").trim().toLowerCase() === (roomName ?? "").trim().toLowerCase()
  );
  const duplicateNameMessage = roomName?.trim() && duplicateRoom ? `Room name "${duplicateRoom.name}" already exists.` : null;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {submitErrorMessage && !submitValidationMessages && (
        <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20 mb-4">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-destructive leading-snug">
            {submitErrorMessage}
          </p>
        </div>
      )}

      {/* Room Name */}
      <div className="space-y-2.5">
        <Label htmlFor="name" className="text-sm font-semibold text-zinc-950">
          Room Name
        </Label>
        <div className="relative">
          <Input
            id="name"
            {...form.register("name")}
            className={cn(
              "h-10 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              (form.formState.errors.name || submitValidationMessages?.name || duplicateNameMessage)
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            disabled={isLoading}
            placeholder="e.g., Room 101"
          />
          {(form.formState.errors.name || submitValidationMessages?.name || duplicateNameMessage) && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
          {!(form.formState.errors.name || submitValidationMessages?.name || duplicateNameMessage) && !!roomName && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
        </div>
        {(form.formState.errors.name || submitValidationMessages?.name || duplicateNameMessage) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {(form.formState.errors.name?.message as string) || submitValidationMessages?.name?.[0] || duplicateNameMessage}
            </p>
          </div>
        )}
      </div>

      {/* Center Selector */}
      <div className="space-y-2.5">
        <Label htmlFor="centerId" className="text-sm font-semibold text-zinc-950">
          Center
        </Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none z-10" />
          <Select
            value={form.watch("centerId")}
            onValueChange={(value) => {
              const selected = centers.find((c) => c.id === value);
              form.setValue("centerId", value, { shouldValidate: true });
              form.setValue("centerName", selected?.name ?? "");
            }}
            disabled={isLoading || centersLoading}
          >
            <SelectTrigger
              id="centerId"
              className={cn(
                "h-10 pl-9 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
                (form.formState.errors.centerId || submitValidationMessages?.centerId)
                  ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                  : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
              )}
            >
              <SelectValue placeholder={centersLoading ? "Loading centers…" : "Select a center"} />
            </SelectTrigger>
            <SelectContent>
              {centers.length === 0 && !centersLoading && (
                <SelectItem value="__empty__" disabled>No centers available</SelectItem>
              )}
              {centers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c.location ? <span className="text-zinc-400 ml-1 text-xs">— {c.location}</span> : null}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(form.formState.errors.centerId || submitValidationMessages?.centerId) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {(form.formState.errors.centerId?.message as string) || submitValidationMessages?.centerId?.[0]}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="capacity" className="text-sm font-semibold text-zinc-950">
          Capacity
        </Label>
        <div className="relative">
          <Input
            id="capacity"
            type="number"
            {...form.register("capacity")}
            className={cn(
              "h-10 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              (form.formState.errors.capacity || submitValidationMessages?.capacity)
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            disabled={isLoading}
            placeholder="e.g., 50"
          />
          {(form.formState.errors.capacity || submitValidationMessages?.capacity) && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
          {!(form.formState.errors.capacity || submitValidationMessages?.capacity) && !!form.watch("capacity") && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
        </div>
        {(form.formState.errors.capacity || submitValidationMessages?.capacity) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {(form.formState.errors.capacity?.message as string) || submitValidationMessages?.capacity?.[0]}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="status" className="text-sm font-semibold text-zinc-950">
          Status
        </Label>
        <Select
          value={form.watch("status")}
          onValueChange={(value) => form.setValue("status", value as "Available" | "Maintenance")}
          disabled={isLoading}
        >
          <SelectTrigger className={cn(
            "h-10 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
            (form.formState.errors.status || submitValidationMessages?.status)
              ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
              : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
          )}>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        {(form.formState.errors.status || submitValidationMessages?.status) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {(form.formState.errors.status?.message as string) || submitValidationMessages?.status?.[0]}
            </p>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading || hasErrors || Boolean(duplicateNameMessage)}
        className="w-full h-10 rounded-none bg-zinc-950 text-white font-semibold shadow-sm shadow-zinc-950/10 hover:bg-zinc-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <div className="size-4 rounded-full border-2 border-transparent border-t-white animate-spin" />
            Saving...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            {initialData ? "Update Room" : "Add Room"}
          </span>
        )}
      </Button>
    </form>
  );
}
