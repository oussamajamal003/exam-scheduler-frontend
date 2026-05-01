import { ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { cn } from "../../lib/utils";

interface FilterPopoverProps {
  /** Number of currently active filters; shown as a small badge on the trigger. */
  activeCount: number;
  /** Called when the user clicks "Clear all" inside the popover. */
  onClear: () => void;
  /** Filter controls rendered inside the popover body. */
  children: ReactNode;
  /** Optional override label (defaults to "Filter"). */
  label?: string;
  /** Optional className for the trigger. */
  className?: string;
  /** Optional popover content className (e.g. for a wider popover). */
  contentClassName?: string;
}

/**
 * Single-button filter trigger with an active-count badge that opens a
 * popover containing the actual filter controls. Matches AdminLayout
 * styling: zinc-200 borders, rounded-none, h-10 trigger, premium shadow.
 */
export function FilterPopover({
  activeCount,
  onClear,
  children,
  label = "Filter",
  className,
  contentClassName,
}: FilterPopoverProps) {
  const hasActive = activeCount > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 rounded-none border-zinc-200 bg-white text-zinc-950 font-semibold inline-flex items-center gap-2 hover:bg-zinc-50 active:scale-95 transition-all",
            hasActive && "border-zinc-950",
            className
          )}
        >
          <SlidersHorizontal className="size-4" />
          <span>{label}</span>
          {hasActive && (
            <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-zinc-950 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={cn("w-80 p-0", contentClassName)}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <div className="text-[11px] uppercase tracking-wide font-semibold text-zinc-500">
            Filters
          </div>
          {hasActive && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950"
            >
              <X className="size-3.5" />
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3 p-4">{children}</div>
      </PopoverContent>
    </Popover>
  );
}

interface FilterFieldProps {
  label: string;
  children: ReactNode;
}

/** Labeled wrapper for a single filter control inside the popover. */
export function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] uppercase tracking-wide font-semibold text-zinc-500">
        {label}
      </label>
      {children}
    </div>
  );
}
