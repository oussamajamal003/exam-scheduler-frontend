import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "../../lib/utils";

type AsyncSearchSelectProps<T> = {
  value?: string;
  selectedLabel?: string;
  placeholder: string;
  searchPlaceholder: string;
  options: T[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onValueChange: (value: string, option: T) => void;
  getOptionValue: (option: T) => string;
  getOptionLabel: (option: T) => string;
  isOptionDisabled?: (option: T) => boolean;
  getOptionDisabledReason?: (option: T) => string | undefined;
  renderOption?: (option: T) => ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  className?: string;
};

export function AsyncSearchSelect<T>({
  value,
  selectedLabel,
  placeholder,
  searchPlaceholder,
  options,
  searchValue,
  onSearchChange,
  onValueChange,
  getOptionValue,
  getOptionLabel,
  isOptionDisabled,
  getOptionDisabledReason,
  renderOption,
  disabled,
  isLoading,
  errorMessage,
  emptyMessage = "No results found",
  className,
}: AsyncSearchSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "min-h-10 h-auto w-full justify-between rounded-none border-zinc-200 bg-white/50 px-3 py-2 text-left text-sm font-normal transition-all hover:border-zinc-300 hover:bg-white",
            errorMessage && "border-destructive/60 bg-destructive/5",
            className
          )}
        >
          <span className={cn("min-w-0 flex-1 whitespace-normal wrap-anywhere text-left leading-4", !selectedLabel && "text-zinc-500")}>
            {selectedLabel || placeholder}
          </span>
          <ChevronDown className="ml-2 size-4 shrink-0 text-zinc-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
        <div className="border-b border-zinc-200 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              ref={inputRef}
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 rounded-none border-zinc-200 pl-8 text-sm shadow-none"
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-zinc-500">
              <Loader2 className="size-4 animate-spin" />
              Loading
            </div>
          ) : options.length === 0 ? (
            <div className="px-2 py-3 text-sm text-zinc-500">{emptyMessage}</div>
          ) : (
            options.map((option) => {
              const optionValue = getOptionValue(option);
              const selected = optionValue === value;
              const optionDisabled = isOptionDisabled?.(option) ?? false;
              const disabledReason = optionDisabled ? getOptionDisabledReason?.(option) : undefined;
              return (
                <button
                  key={optionValue}
                  type="button"
                  disabled={optionDisabled}
                  title={disabledReason}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-none px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-zinc-100 focus:bg-zinc-100",
                    optionDisabled && "cursor-not-allowed opacity-50 hover:bg-transparent focus:bg-transparent"
                  )}
                  onClick={() => {
                    if (optionDisabled) return;
                    onValueChange(optionValue, option);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("size-4 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 flex-1 whitespace-normal wrap-anywhere leading-4">
                    {renderOption ? renderOption(option) : getOptionLabel(option)}
                    {disabledReason ? <span className="mt-0.5 block text-xs text-zinc-500">{disabledReason}</span> : null}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}