import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ActiveFilterBadgeItem = {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
};

type ActiveFilterBadgesProps = {
  badges: ActiveFilterBadgeItem[];
  onClearAll?: () => void;
  className?: string;
};

export function ActiveFilterBadges({ badges, onClearAll, className }: ActiveFilterBadgesProps) {
  if (badges.length === 0) return null;

  return (
    <div
      className={
        "flex flex-wrap items-center gap-2 border border-zinc-200/70 bg-white p-3 dark:border-zinc-800/70 dark:bg-zinc-950" +
        (className ? ` ${className}` : "")
      }
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        Active filters
      </span>
      {badges.map((badge) => (
        <Badge
          key={badge.key}
          variant="secondary"
          className="flex max-w-full items-start gap-1.5 normal-case tracking-normal"
        >
          <span className="font-bold text-zinc-500 dark:text-zinc-400">{badge.label}:</span>
          <span title={badge.value} className="max-w-[20rem] whitespace-normal break-words leading-4 text-zinc-900 dark:text-zinc-100">
            {badge.value}
          </span>
          <button
            type="button"
            onClick={badge.onRemove}
            className="ml-1 inline-flex size-3.5 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-zinc-50"
            aria-label={`Remove ${badge.label} filter`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {onClearAll ? (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onClearAll}
          className="ml-auto rounded-none text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
        >
          Clear all
        </Button>
      ) : null}
    </div>
  );
}
