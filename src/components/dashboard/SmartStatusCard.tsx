import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ArrowRight, type LucideIcon } from 'lucide-react';

export type SmartStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TONE_STYLES: Record<SmartStatusTone, { badge: string; accent: string; iconBg: string }> = {
  neutral: {
    badge: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    accent: 'before:bg-zinc-400',
    iconBg: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
  },
  info: {
    badge: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300',
    accent: 'before:bg-sky-500',
    iconBg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  },
  success: {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300',
    accent: 'before:bg-emerald-500',
    iconBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  },
  warning: {
    badge: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300',
    accent: 'before:bg-amber-500',
    iconBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  },
  danger: {
    badge: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300',
    accent: 'before:bg-rose-500',
    iconBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
  },
};

interface SmartStatusCardProps {
  title: string;
  description?: string;
  statusLabel: string;
  tone?: SmartStatusTone;
  icon: LucideIcon;
  metadata?: { label: string; value: string | number }[];
  action?: { label: string; onClick: () => void };
  loading?: boolean;
}

export const SmartStatusCard: React.FC<SmartStatusCardProps> = ({
  title,
  description,
  statusLabel,
  tone = 'neutral',
  icon: Icon,
  metadata,
  action,
  loading,
}) => {
  const styles = TONE_STYLES[tone];

  if (loading) {
    return (
      <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <CardContent className="space-y-3 p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-none border border-zinc-200/70 bg-white shadow-sm transition-all duration-300 hover:shadow-lg dark:border-zinc-800/70 dark:bg-zinc-950',
        'before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:transition-all',
        styles.accent
      )}
    >
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn('rounded-none p-2.5', styles.iconBg)}>
              <Icon className="size-5" />
            </div>
            <div className="space-y-1">
              <Badge className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide border', styles.badge)}>
                {statusLabel}
              </Badge>
              <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {title}
              </h3>
            </div>
          </div>
        </div>

        {description && (
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        )}

        {metadata && metadata.length > 0 && (
          <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800/70 sm:grid-cols-3">
            {metadata.map((m) => (
              <div key={m.label} className="space-y-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {m.label}
                </p>
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {action && (
          <Button
            onClick={action.onClick}
            size="sm"
            className="h-9 w-full rounded-none bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 sm:w-auto"
          >
            {action.label}
            <ArrowRight className="size-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
