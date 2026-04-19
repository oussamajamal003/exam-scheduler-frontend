import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, id, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2 text-left">
        <Label 
          htmlFor={id} 
          className={cn(
            "text-[13px] font-medium transition-colors",
            error ? "text-destructive" : "text-zinc-700"
          )}
        >
          {label}
        </Label>
        <Input 
          id={id} 
          ref={ref} 
          {...props} 
          className={cn(
            "h-11 bg-zinc-50/50 shadow-none transition-all placeholder:text-zinc-400 hover:bg-zinc-50 focus-visible:bg-transparent focus-visible:ring-1",
            error 
              ? "border-destructive/50 bg-destructive/5 hover:bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/20" 
              : "border-zinc-200 focus-visible:border-zinc-950 focus-visible:ring-zinc-950/20",
            className
          )}
        />
        {error && (
          <p className="text-[13px] font-medium text-destructive animate-in slide-in-from-top-1 fade-in-0 duration-200">
            {error}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";
