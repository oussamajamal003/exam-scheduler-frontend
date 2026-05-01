import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  DoorOpen,
  Layers,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "../../lib/utils";

type ConflictType =
  | "STUDENT_OVERLAP"
  | "SUPERVISOR_DOUBLE_BOOKED"
  | "ROOM_OVERCAPACITY"
  | "RESOURCE_UNAVAILABLE"
  | "TIME_CONSTRAINT_VIOLATION";

type TypeStyle = {
  icon: ComponentType<{ className?: string }>;
  short: string;
  full: string;
  bg: string;
  text: string;
  ring: string;
};

const TYPE_STYLES: Record<string, TypeStyle> = {
  STUDENT_OVERLAP: {
    icon: Users,
    short: "Student",
    full: "Student overlap",
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200",
  },
  SUPERVISOR_DOUBLE_BOOKED: {
    icon: ShieldAlert,
    short: "Supervisor",
    full: "Supervisor double-booked",
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-200",
  },
  ROOM_OVERCAPACITY: {
    icon: DoorOpen,
    short: "Room",
    full: "Room overcapacity",
    bg: "bg-orange-50",
    text: "text-orange-700",
    ring: "ring-orange-200",
  },
  RESOURCE_UNAVAILABLE: {
    icon: Layers,
    short: "Resource",
    full: "Resource unavailable",
    bg: "bg-zinc-100",
    text: "text-zinc-700",
    ring: "ring-zinc-200",
  },
  TIME_CONSTRAINT_VIOLATION: {
    icon: CalendarClock,
    short: "Time",
    full: "Time constraint",
    bg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-200",
  },
};

const DEFAULT_STYLE: TypeStyle = {
  icon: AlertTriangle,
  short: "Conflict",
  full: "Conflict",
  bg: "bg-zinc-100",
  text: "text-zinc-700",
  ring: "ring-zinc-200",
};

const styleFor = (type?: string | null): TypeStyle =>
  (type && TYPE_STYLES[type]) || DEFAULT_STYLE;

interface ConflictTypeBadgeProps {
  type: ConflictType | string;
  /** When true, only show the icon and short label (compact). */
  compact?: boolean;
  /** Numeric count to append (e.g. when the same type appears multiple times). */
  count?: number;
  className?: string;
}

/** Single shadcn-style badge for one conflict type. */
export function ConflictTypeBadge({
  type,
  compact = false,
  count,
  className,
}: ConflictTypeBadgeProps) {
  const s = styleFor(type);
  const Icon = s.icon;
  return (
    <span
      title={s.full}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        s.bg,
        s.text,
        s.ring,
        className
      )}
    >
      <Icon className="size-3" />
      {compact ? s.short : s.full}
      {typeof count === "number" && count > 1 && (
        <span className="ml-0.5 tabular-nums">×{count}</span>
      )}
    </span>
  );
}

interface ConfirmedBadgeProps {
  label?: string;
  className?: string;
}

/** Green "clean / confirmed" badge used when no conflict is present. */
export function ConfirmedBadge({
  label = "Confirmed",
  className,
}: ConfirmedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-200",
        className
      )}
    >
      <CheckCircle2 className="size-3" />
      {label}
    </span>
  );
}

interface ConflictBadgesProps {
  /** All conflict types affecting one assignment (may include duplicates). */
  types: Array<ConflictType | string>;
  /** Render compact short labels (better inside dense rows / cards). */
  compact?: boolean;
  /** Maximum number of distinct badges to render before showing "+N more". */
  max?: number;
  /** Confirmed-state label override. */
  confirmedLabel?: string;
  className?: string;
}

/**
 * Renders one badge per distinct conflict type for an assignment.
 * When `types` is empty, renders the green Confirmed badge.
 */
export function ConflictBadges({
  types,
  compact = false,
  max = 3,
  confirmedLabel,
  className,
}: ConflictBadgesProps) {
  if (!types || types.length === 0) {
    return <ConfirmedBadge label={confirmedLabel} className={className} />;
  }

  // Count occurrences per type while preserving first-seen order.
  const counts = new Map<string, number>();
  for (const t of types) counts.set(t, (counts.get(t) ?? 0) + 1);
  const ordered = Array.from(counts.entries());
  const visible = ordered.slice(0, max);
  const overflow = ordered.length - visible.length;

  return (
    <div className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      {visible.map(([t, n]) => (
        <ConflictTypeBadge key={t} type={t} compact={compact} count={n} />
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700 ring-1 ring-inset ring-zinc-200">
          +{overflow}
        </span>
      )}
    </div>
  );
}
