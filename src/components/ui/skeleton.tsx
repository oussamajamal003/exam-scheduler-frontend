import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn("animate-pulse rounded-none bg-zinc-200", className)}
      {...props}
    />
  );
};

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeletonRows: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 5,
  className,
}) => {
  return (
    <div className={cn("px-4 py-2 sm:px-6", className)}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex items-center gap-4 border-b border-zinc-100 px-0 py-3.5 last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className={cn(
                "h-3",
                colIndex === 0 ? "w-32" : colIndex === columns - 1 ? "w-20" : "flex-1"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 5,
  className
}) => {
  return (
    <div className={cn("overflow-hidden rounded-none border border-zinc-200/60", className)}>
      {/* Header row */}
      <div className="flex items-center gap-4 border-b border-zinc-200/60 bg-zinc-50 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className={cn('h-3', i === columns - 1 ? 'w-16' : 'flex-1')} />
        ))}
      </div>
      <TableSkeletonRows rows={rows} columns={columns} className="px-4" />
    </div>
  );
};

export { Skeleton };