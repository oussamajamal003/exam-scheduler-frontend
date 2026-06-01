import React from 'react';
import { cn } from '@/lib/utils';

export const Toggle = ({ checked, disabled, onClick }: { checked: boolean; disabled?: boolean; onClick: () => void }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-zinc-300',
      checked
        ? 'bg-zinc-950 dark:bg-zinc-100'
        : 'bg-zinc-200 dark:bg-zinc-800'
    )}
  >
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform dark:bg-zinc-950',
        checked ? 'translate-x-5' : 'translate-x-0'
      )}
    />
  </button>
);

export const ToggleRow = ({
  title,
  description,
  checked,
  disabled,
  onToggle,
  icon: Icon,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <div className="flex items-center justify-between gap-4 rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/40">
    <div className="flex min-w-0 gap-3">
      {Icon && (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-none bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
          <Icon className="size-4" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
    </div>
    <Toggle checked={checked} disabled={disabled} onClick={onToggle} />
  </div>
);

export const NumberField = ({
  label,
  description,
  value,
  min,
  max,
  disabled,
  onChange,
  suffix,
}: {
  label: string;
  description?: string;
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  suffix?: string;
}) => (
  <div className="space-y-2 rounded-none border border-zinc-200/70 bg-white p-4 dark:border-zinc-800/70 dark:bg-zinc-950">
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          disabled={disabled}
          value={Number.isFinite(value) ? value : ''}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-9 w-20 rounded-none border border-zinc-300 bg-white px-2 text-right text-sm tabular-nums text-zinc-950 outline-none focus:border-zinc-950 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
        {suffix && <span className="text-xs text-zinc-500 dark:text-zinc-400">{suffix}</span>}
      </div>
    </div>
    {description && <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{description}</p>}
  </div>
);

export const TabButton = ({
  active,
  icon: Icon,
  children,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex h-10 items-center justify-center gap-2 rounded-none border px-4 text-xs font-semibold transition-colors',
      active
        ? 'border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
        : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900'
    )}
  >
    <Icon className="size-4" />
    {children}
  </button>
);
