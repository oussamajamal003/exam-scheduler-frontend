import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'default';
  className?: string;
};

export const DownloadPdfButton: React.FC<Props> = ({
  onClick,
  loading = false,
  disabled = false,
  label = 'Download PDF',
  variant = 'outline',
  size = 'sm',
  className,
}) => (
  <Button
    type="button"
    onClick={onClick}
    disabled={disabled || loading}
    size={size}
    variant={variant === 'primary' ? 'default' : 'outline'}
    className={cn(
      'inline-flex items-center gap-2 rounded-none font-semibold',
      variant === 'primary'
        ? 'bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200'
        : 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900',
      className
    )}
  >
    {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
    {loading ? 'Generating…' : label}
  </Button>
);
