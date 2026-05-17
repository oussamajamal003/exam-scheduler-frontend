import React from 'react';
import { Button } from '../ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center px-4 py-16 text-center", className)}>
      {Icon && (
        <div className="mb-5 flex size-12 items-center justify-center rounded-none border border-zinc-200 bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-900/70">
          <Icon className="size-5 text-zinc-400 dark:text-zinc-500" />
        </div>
      )}
      <h3 className="mb-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</h3>
      <p className="mb-6 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="rounded-none h-8 px-4 text-xs">
          {action.label}
        </Button>
      )}
    </div>
  );
};