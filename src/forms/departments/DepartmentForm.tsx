import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Building } from 'lucide-react';
import { z } from 'zod';
import type { CreateDepartmentDto, Department } from '@/schemas/department';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const departmentFormSchema = z.object({
  name: z.string().min(2, { message: 'Department name must be at least 2 characters' }),
  code: z.string().min(2, { message: 'Department code must be at least 2 characters' }).max(12, { message: 'Department code must be 12 characters or less' }),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

interface DepartmentFormProps {
  initialData?: Department;
  onSubmit: (data: CreateDepartmentDto) => void;
  isLoading?: boolean;
  submitErrorMessage?: string;
  submitValidationMessages?: Record<string, string[]>;
}

export function DepartmentForm({ initialData, onSubmit, isLoading, submitErrorMessage, submitValidationMessages }: DepartmentFormProps) {
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: initialData ?? {
      name: '',
      code: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
      return;
    }

    form.reset({
      name: '',
      code: '',
    });
  }, [form, initialData]);

  const watchedName = useWatch({ control: form.control, name: 'name' });
  const watchedCode = useWatch({ control: form.control, name: 'code' });
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {submitErrorMessage && (
        <div className="rounded-none border border-red-200 bg-red-50 p-4 text-red-900">
          <div className="flex gap-3">
            <AlertCircle className="size-5 text-red-600" />
            <div className="space-y-1">
              <h5 className="text-sm font-medium leading-none">Error</h5>
              <div className="text-sm text-red-800">{submitErrorMessage}</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        <Label htmlFor="department-name" className="text-sm font-semibold text-zinc-950">
          Name
        </Label>
        <div className="relative">
          <Input
            id="department-name"
            {...form.register('name')}
            disabled={isLoading}
            placeholder="e.g., Computer Science"
            className={cn(
              'h-10 rounded-none border-zinc-200 bg-white/50 pr-10 text-sm transition-all',
              form.formState.errors.name || submitValidationMessages?.name
                ? 'border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30'
                : 'hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50'
            )}
          />
          {form.formState.errors.name || submitValidationMessages?.name ? (
            <AlertCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-destructive" />
          ) : watchedName ? (
            <CheckCircle2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-500" />
          ) : null}
        </div>
        {form.formState.errors.name ? (
          <p className="text-xs font-medium text-destructive">{form.formState.errors.name.message}</p>
        ) : submitValidationMessages?.name ? (
          <p className="text-xs font-medium text-destructive">{submitValidationMessages.name[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="department-code" className="text-sm font-semibold text-zinc-950">
          Code
        </Label>
        <div className="relative">
          <Input
            id="department-code"
            {...form.register('code')}
            disabled={isLoading}
            placeholder="e.g., CS"
            className={cn(
              'h-10 rounded-none border-zinc-200 bg-white/50 pr-10 text-sm uppercase tracking-[0.12em] transition-all',
              form.formState.errors.code || submitValidationMessages?.code
                ? 'border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30'
                : 'hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50'
            )}
          />
          {form.formState.errors.code || submitValidationMessages?.code ? (
            <AlertCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-destructive" />
          ) : watchedCode ? (
            <CheckCircle2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-500" />
          ) : null}
        </div>
        {form.formState.errors.code ? (
          <p className="text-xs font-medium text-destructive">{form.formState.errors.code.message}</p>
        ) : submitValidationMessages?.code ? (
          <p className="text-xs font-medium text-destructive">{submitValidationMessages.code[0]}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={isLoading || hasErrors}
        className="w-full h-10 rounded-none bg-zinc-950 text-white font-semibold shadow-sm shadow-zinc-950/10 hover:bg-zinc-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <div className="size-4 rounded-full border-2 border-transparent border-t-white animate-spin" />
            Saving...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Building className="size-4" />
            {initialData ? 'Update Department' : 'Add Department'}
          </span>
        )}
      </Button>
    </form>
  );
}