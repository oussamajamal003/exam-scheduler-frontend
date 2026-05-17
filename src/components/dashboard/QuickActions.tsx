import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Zap, type LucideIcon } from 'lucide-react';

export interface QuickAction {
  label: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
  tone?: 'zinc' | 'indigo' | 'emerald' | 'amber' | 'sky' | 'violet';
}

const TONE: Record<NonNullable<QuickAction['tone']>, string> = {
  zinc: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
  indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
};

interface QuickActionsProps {
  actions: QuickAction[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
      <CardHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800/70">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          <Zap className="size-4 text-zinc-400 dark:text-zinc-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className="group flex items-center gap-3 rounded-none border border-zinc-200/70 bg-white p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-800/70 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:focus-visible:ring-zinc-100"
            >
              <div className={cn('rounded-none p-2 transition-transform group-hover:scale-110', TONE[a.tone ?? 'zinc'])}>
                <a.icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">{a.label}</p>
                {a.description && (
                  <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">{a.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
