import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roomSchema, Room } from "../../schemas/room";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface RoomFormProps {
  initialData?: Room;
  onSubmit: (data: Room) => void;
  isLoading?: boolean;
}

export function RoomForm({ initialData, onSubmit, isLoading }: RoomFormProps) {
  const form = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: initialData || {
      name: "",
      center: "",
      capacity: undefined,
      status: "Available",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
      return;
    }

    form.reset({
      name: "",
      center: "",
      capacity: undefined,
      status: "Available",
    });
  }, [form, initialData]);

  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
              form.formState.errors.name
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            disabled={isLoading}
            placeholder="e.g., Room 101"
          />
          {form.formState.errors.name && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
          {!form.formState.errors.name && !!form.watch("name") && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
        </div>
        {form.formState.errors.name && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {form.formState.errors.name.message as string}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="center" className="text-sm font-semibold text-zinc-950">
          Center
        </Label>
        <div className="relative">
          <Input
            id="center"
            {...form.register("center")}
            className={cn(
              "h-10 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              form.formState.errors.center
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            disabled={isLoading}
            placeholder="e.g., North Campus"
          />
          {form.formState.errors.center && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
          {!form.formState.errors.center && !!form.watch("center") && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
        </div>
        {form.formState.errors.center && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {form.formState.errors.center.message as string}
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
              form.formState.errors.capacity
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            disabled={isLoading}
            placeholder="e.g., 50"
          />
          {form.formState.errors.capacity && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
          {!form.formState.errors.capacity && !!form.watch("capacity") && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
        </div>
        {form.formState.errors.capacity && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {form.formState.errors.capacity.message as string}
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
            form.formState.errors.status
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
        {form.formState.errors.status && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {form.formState.errors.status.message as string}
            </p>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading || hasErrors}
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
