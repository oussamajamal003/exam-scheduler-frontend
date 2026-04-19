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
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      {Icon && (
        <div className="rounded-none bg-zinc-100 p-3 mb-4">
          <Icon className="size-6 text-zinc-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-zinc-950 mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 mb-6 max-w-sm">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="rounded-none">
          {action.label}
        </Button>
      )}
    </div>
  );
};