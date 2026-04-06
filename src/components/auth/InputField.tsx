import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, id, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full text-left">
        <Label 
          htmlFor={id} 
          className={`font-medium ${error ? 'text-red-500' : 'text-slate-900'}`}
        >
          {label}
        </Label>
        <Input 
          id={id} 
          ref={ref} 
          {...props} 
          className={`focus-visible:ring-blue-600 ${
            error ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50' : ''
          } ${className}`}
        />
        {error && (
          <p className="text-sm text-red-500 font-medium animate-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";
