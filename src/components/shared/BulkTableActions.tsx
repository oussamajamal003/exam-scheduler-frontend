import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RowSelectCheckbox({
  checked,
  indeterminate,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      disabled={disabled}
      ref={(node) => {
        if (node) node.indeterminate = Boolean(indeterminate);
      }}
      onChange={(event) => onChange(event.target.checked)}
      onClick={(event) => event.stopPropagation()}
      className="size-4 rounded-none border-zinc-300 text-zinc-950 accent-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

export function BulkDeleteToolbar({
  selectedCount,
  totalCount,
  isDeleting,
  onClear,
  onDelete,
  className,
}: {
  selectedCount: number;
  totalCount: number;
  isDeleting?: boolean;
  onClear: () => void;
  onDelete: () => void;
  className?: string;
}) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "mb-3 flex flex-col gap-3 rounded-none border border-zinc-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950",
        className
      )}
    >
      <div>
        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          {selectedCount} selected
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Showing {totalCount} rows in the current table view.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClear}
          disabled={isDeleting}
          className="h-9 rounded-none border-zinc-200 text-xs font-semibold"
        >
          Clear selection
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          disabled={isDeleting}
          className="h-9 rounded-none text-xs font-semibold"
        >
          <Trash2 className="mr-1.5 size-3.5" />
          Bulk Delete
        </Button>
      </div>
    </div>
  );
}
