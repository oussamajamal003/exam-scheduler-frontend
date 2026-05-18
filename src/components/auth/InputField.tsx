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
            error ? "text-rose-200" : "text-white/88"
          )}
        >
          {label}
        </Label>
        <Input 
          id={id} 
          ref={ref} 
          {...props} 
          className={cn(
            "h-11 border-white/28 bg-white/14 text-white shadow-none transition-all placeholder:text-white/45 hover:bg-white/18 focus-visible:bg-white/20 focus-visible:ring-1",
            error 
              ? "border-rose-300/45 bg-rose-500/10 hover:bg-rose-500/12 focus-visible:border-rose-200 focus-visible:ring-rose-200/30" 
              : "focus-visible:border-white/45 focus-visible:ring-white/20",
            className
          )}
        />
        {error && (
          <p className="animate-in slide-in-from-top-1 fade-in-0 text-[13px] font-medium text-rose-200 duration-200">
            {error}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";
