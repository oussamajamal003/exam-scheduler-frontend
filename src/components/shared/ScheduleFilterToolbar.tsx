import { CalendarRange, Filter, RotateCcw, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ScheduleFilterOption = {
  value: string;
  label: string;
};

type ScheduleFilterField = {
  key: string;
  label: string;
  value: string;
  placeholder: string;
  options: ScheduleFilterOption[];
  onChange: (value: string) => void;
};

type ScheduleFilterToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  queryPlaceholder: string;
  fields?: ScheduleFilterField[];
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;
  examDate?: string;
  onExamDateChange?: (value: string) => void;
  activeCount?: number;
  resultSummary?: string;
  onReset?: () => void;
};

export function ScheduleFilterToolbar({
  query,
  onQueryChange,
  queryPlaceholder,
  fields = [],
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  examDate,
  onExamDateChange,
  activeCount = 0,
  resultSummary,
  onReset,
}: ScheduleFilterToolbarProps) {
  const hasDateRange = typeof onStartDateChange === "function" || typeof onEndDateChange === "function";
  const hasExamDate = typeof onExamDateChange === "function";
  const hasFilters = activeCount > 0 || query.trim().length > 0;

  return (
    <section className="overflow-hidden border border-zinc-200/80 bg-white shadow-[0_18px_45px_-32px_rgba(24,24,27,0.55)] dark:border-zinc-800/80 dark:bg-zinc-950 dark:shadow-black/40">
      <div className="border-b border-zinc-200/70 bg-zinc-950 text-white dark:border-zinc-800 dark:bg-zinc-100 dark:text-zinc-950">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex size-8 items-center justify-center border border-white/15 bg-white/10 dark:border-zinc-950/15 dark:bg-zinc-950/10">
                <SlidersHorizontal className="size-4" />
              </span>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-300 dark:text-zinc-600">
                  Schedule Controls
                </div>
                {resultSummary ? (
                  <p className="mt-0.5 text-sm font-semibold text-white dark:text-zinc-950">{resultSummary}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex h-9 items-center gap-2 border border-white/15 bg-white/10 px-3 text-xs font-semibold text-zinc-100 dark:border-zinc-950/15 dark:bg-zinc-950/10 dark:text-zinc-700">
              <span className={cn(
                "size-2 rounded-full",
                activeCount > 0 || query.trim().length > 0 ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]" : "bg-zinc-500 dark:bg-zinc-400"
              )} />
              {activeCount} active
            </div>
            {hasFilters && onReset ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onReset}
                className="h-9 rounded-none border border-white/15 bg-white/10 px-3 text-white hover:bg-white/15 hover:text-white dark:border-zinc-950/15 dark:bg-zinc-950/10 dark:text-zinc-800 dark:hover:bg-zinc-950/15 dark:hover:text-zinc-950"
              >
                <RotateCcw className="mr-1.5 size-3.5" />
                Reset
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_32%),linear-gradient(180deg,rgba(250,250,250,0.96),rgba(255,255,255,1))] p-4 dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_32%),linear-gradient(180deg,rgba(24,24,27,0.98),rgba(9,9,11,1))] sm:p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.65fr)]">
          <div className="group/search relative min-w-0 overflow-hidden border border-zinc-200/80 bg-white shadow-sm transition-all focus-within:border-zinc-400 focus-within:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:border-zinc-500">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center border-r border-zinc-100 bg-zinc-50 text-zinc-400 transition-colors group-focus-within/search:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:group-focus-within/search:text-zinc-100">
              <Search className="size-4" />
            </div>
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={queryPlaceholder}
              className="h-14 rounded-none border-0 bg-transparent pl-14 pr-10 text-sm font-medium shadow-none placeholder:text-zinc-400 focus-visible:ring-0 dark:text-zinc-100"
            />
            {query.trim() ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onQueryChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-none text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {fields.map((field) => {
              const isActive = field.value !== "" && field.value !== field.options[0]?.value;
              const selectedOption = field.options.find((option) => option.value === field.value);
              return (
              <div
                key={field.key}
                className={cn(
                  "group/filter min-w-0 space-y-1.5 border bg-white/92 p-2.5 shadow-sm transition-all dark:bg-zinc-950/92",
                  isActive
                    ? "border-zinc-400 shadow-md dark:border-zinc-500"
                    : "border-zinc-200/80 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                )}
              >
                <Label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  {field.label}
                  {isActive ? <Sparkles className="size-3 text-emerald-500" /> : null}
                </Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    title={selectedOption?.label ?? field.placeholder}
                    className="min-h-10 h-auto min-w-0 items-start rounded-none border-0 bg-zinc-50 px-3 py-2 text-left text-sm font-semibold shadow-none transition-colors hover:bg-zinc-100 focus:ring-1 focus:ring-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
            })}

            {hasExamDate ? (
              <div className="space-y-1.5 border border-zinc-200/80 bg-white/92 p-2.5 shadow-sm transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/92 dark:hover:border-zinc-700">
                <Label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  Exam Date
                  <CalendarRange className="size-3 text-zinc-400" />
                </Label>
                <Input
                  type="date"
                  value={examDate ?? ""}
                  onChange={(event) => onExamDateChange?.(event.target.value)}
                  className="h-10 rounded-none border-0 bg-zinc-50 px-3 text-sm font-semibold shadow-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            ) : null}

            {hasDateRange ? (
              <>
                <div className="space-y-1.5 border border-zinc-200/80 bg-white/92 p-2.5 shadow-sm transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/92 dark:hover:border-zinc-700">
                  <Label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                    Start Date
                    <CalendarRange className="size-3 text-zinc-400" />
                  </Label>
                  <Input
                    type="date"
                    value={startDate ?? ""}
                    onChange={(event) => onStartDateChange?.(event.target.value)}
                    className="h-10 rounded-none border-0 bg-zinc-50 px-3 text-sm font-semibold shadow-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1.5 border border-zinc-200/80 bg-white/92 p-2.5 shadow-sm transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/92 dark:hover:border-zinc-700">
                  <Label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                    End Date
                    <CalendarRange className="size-3 text-zinc-400" />
                  </Label>
                  <Input
                    type="date"
                    value={endDate ?? ""}
                    onChange={(event) => onEndDateChange?.(event.target.value)}
                    className="h-10 rounded-none border-0 bg-zinc-50 px-3 text-sm font-semibold shadow-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200/70 pt-3 text-xs text-zinc-500 dark:border-zinc-800/70 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
            <Filter className="size-3.5" />
            {activeCount} filter{activeCount === 1 ? "" : "s"}
          </span>
          <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span>{query.trim() ? "Search active" : "Search idle"}</span>
          {hasDateRange ? (
            <>
              <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span>{startDate || endDate ? "Date range set" : "Any date"}</span>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}