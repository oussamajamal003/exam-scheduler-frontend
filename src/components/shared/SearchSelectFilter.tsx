import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../lib/utils";

export type SearchSelectFilterOption = {
  value: string;
  label: string;
  description?: string;
  searchText: string;
};

const normalizeFilterSearch = (value: string) => value.trim().toLowerCase();

export function SearchSelectFilter({
  label,
  value,
  placeholder,
  searchPlaceholder,
  options,
  isLoading,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  searchPlaceholder: string;
  options: SearchSelectFilterOption[];
  isLoading?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((option) => option.value === value) ?? null;
  const term = normalizeFilterSearch(search);
  const visibleOptions = useMemo(
    () => (term ? options.filter((option) => option.searchText.includes(term)) : options),
    [options, term]
  );

  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "min-h-11 h-auto w-full justify-between rounded-none border-zinc-200 bg-white px-3 py-2 text-left text-sm font-semibold text-zinc-950 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-900",
              selected && "border-zinc-950 dark:border-zinc-400"
            )}
          >
            <span className={cn("min-w-0 flex-1 whitespace-normal wrap-break-word leading-4", !selected && "text-zinc-500 dark:text-zinc-400")}>
              {selected?.label ?? placeholder}
            </span>
            <ChevronDown className="ml-2 size-4 shrink-0 text-zinc-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[--radix-popover-trigger-width] min-w-72 rounded-none border-zinc-200 p-0 dark:border-zinc-800">
          <div className="border-b border-zinc-200 p-2 dark:border-zinc-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 rounded-none border-zinc-200 pl-8 text-sm shadow-none dark:border-zinc-800"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {selected ? (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setSearch("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-none px-2 py-2 text-left text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <X className="size-4 shrink-0" />
                Clear {label.toLowerCase()}
              </button>
            ) : null}
            {isLoading ? (
              <div className="px-2 py-3 text-sm text-zinc-500">Loading options...</div>
            ) : visibleOptions.length === 0 ? (
              <div className="px-2 py-3 text-sm text-zinc-500">No matching options</div>
            ) : (
              visibleOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setSearch("");
                      setOpen(false);
                    }}
                    className="flex w-full items-start gap-2 rounded-none px-2 py-2 text-left text-sm transition-colors hover:bg-zinc-100 focus:bg-zinc-100 dark:hover:bg-zinc-900 dark:focus:bg-zinc-900"
                  >
                    <Check className={cn("mt-0.5 size-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                    <span className="min-w-0 flex-1 whitespace-normal wrap-break-word leading-4">
                      <span className="font-semibold text-zinc-950 dark:text-zinc-100">{option.label}</span>
                      {option.description ? <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">{option.description}</span> : null}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}