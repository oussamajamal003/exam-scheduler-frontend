import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Building2, CheckCircle2, Layers } from 'lucide-react';
import { z } from 'zod';
import type { CreateProgramDto, Program } from '@/schemas/program';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const programFormSchema = z.object({
  name: z.string().min(2, { message: 'Program name must be at least 2 characters' }),
  code: z.string().min(2, { message: 'Program code must be at least 2 characters' }).max(16, { message: 'Program code must be 16 characters or less' }),
  departmentName: z.string().optional(),
  departmentCode: z.string().optional(),
});

type ProgramFormValues = z.infer<typeof programFormSchema>;

export type ProgramFormSubmitValues = CreateProgramDto & {
  newDepartment?: {
    name: string;
    code: string;
  };
  editDepartment?: {
    name: string;
    code: string;
  };
};

interface ProgramFormProps {
  initialData?: Program;
  onSubmit: (data: ProgramFormSubmitValues) => void | Promise<void>;
  isLoading?: boolean;
}

export function ProgramForm({ initialData, onSubmit, isLoading }: ProgramFormProps) {
  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      code: initialData?.code ?? '',
      departmentName: initialData?.department?.name ?? '',
      departmentCode: initialData?.department?.code ?? '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    form.reset({
      name: initialData?.name ?? '',
      code: initialData?.code ?? '',
      departmentName: initialData?.department?.name ?? '',
      departmentCode: initialData?.department?.code ?? '',
    });
  }, [form, initialData]);

  const hasErrors = Object.keys(form.formState.errors).length > 0;
  const watchedName = useWatch({ control: form.control, name: 'name' });
  const watchedCode = useWatch({ control: form.control, name: 'code' });

  const handleSubmit = (data: ProgramFormValues) => {
    const isEditMode = Boolean(initialData?.id);
    const departmentName = data.departmentName?.trim() ?? '';
    const departmentCode = data.departmentCode?.trim() ?? '';
    const hasDepartmentInput = Boolean(departmentName || departmentCode);

    if (!isEditMode && !hasDepartmentInput) {
      form.setError('departmentName', {
        type: 'manual',
        message: 'Department name is required',
      });
      form.setError('departmentCode', {
        type: 'manual',
        message: 'Department code is required',
      });
      return;
    }

    if (hasDepartmentInput && !departmentName) {
      form.setError('departmentName', {
        type: 'manual',
        message: 'Department name is required when department code is provided',
      });
      return;
    }

    if (hasDepartmentInput && !departmentCode) {
      form.setError('departmentCode', {
        type: 'manual',
        message: 'Department code is required when department name is provided',
      });
      return;
    }

    if (hasDepartmentInput) {
      if (departmentName.length < 2) {
        form.setError('departmentName', {
          type: 'manual',
          message: 'Department name must be at least 2 characters',
        });
        return;
      }

      if (departmentCode.length < 2) {
        form.setError('departmentCode', {
          type: 'manual',
          message: 'Department code must be at least 2 characters',
        });
        return;
      }
    }

    const payload: ProgramFormSubmitValues = {
      name: data.name.trim(),
      code: data.code.trim(),
      departmentId: initialData?.departmentId ?? '',
    };

    if (hasDepartmentInput) {
      if (isEditMode) {
        payload.editDepartment = {
          name: departmentName,
          code: departmentCode,
        };
      } else {
        payload.newDepartment = {
          name: departmentName,
          code: departmentCode,
        };
      }
    }

    return onSubmit(payload);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
      <div className="space-y-2.5">
        <Label htmlFor="program-name" className="text-sm font-semibold text-zinc-950">
          Program Name
        </Label>
        <div className="relative">
          <Input
            id="program-name"
            {...form.register('name')}
            disabled={isLoading}
            placeholder="e.g., Bachelor of Science in Computer Science"
            className={cn(
              'h-10 rounded-none border-zinc-200 bg-white/50 pr-10 text-sm transition-all',
              form.formState.errors.name
                ? 'border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30'
                : 'hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50'
            )}
          />
          {form.formState.errors.name ? (
            <AlertCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-destructive" />
          ) : watchedName ? (
            <CheckCircle2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-500" />
          ) : null}
        </div>
        {form.formState.errors.name && <p className="text-xs font-medium text-destructive">{form.formState.errors.name.message}</p>}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="program-code" className="text-sm font-semibold text-zinc-950">
          Code
        </Label>
        <div className="relative">
          <Input
            id="program-code"
            {...form.register('code')}
            disabled={isLoading}
            placeholder="e.g., BSCS"
            className={cn(
              'h-10 rounded-none border-zinc-200 bg-white/50 pr-10 text-sm uppercase tracking-[0.12em] transition-all',
              form.formState.errors.code
                ? 'border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30'
                : 'hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50'
            )}
          />
          {form.formState.errors.code ? (
            <AlertCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-destructive" />
          ) : watchedCode ? (
            <CheckCircle2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-500" />
          ) : null}
        </div>
        {form.formState.errors.code && <p className="text-xs font-medium text-destructive">{form.formState.errors.code.message}</p>}
      </div>

      <div className="space-y-2.5">
        <Label className="text-sm font-semibold text-zinc-950">Department</Label>
        <div className="rounded-none border border-zinc-200 bg-zinc-50/60 p-4">
          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 size-4 shrink-0 text-zinc-600" />
            <div>
              <p className="text-sm font-semibold text-zinc-950">
                {initialData?.department?.name ? 'Edit Department Inline' : 'Create Department Inline'}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {initialData?.department?.name
                  ? 'Update department name/code inline. Changes are saved through the department update API.'
                  : 'Enter department details below. The department will be created first, then linked to the program.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2.5">
          <Label htmlFor="department-name" className="text-sm font-semibold text-zinc-950">
            Department Name
          </Label>
          <Input
            id="department-name"
            {...form.register('departmentName')}
            disabled={isLoading}
            placeholder="e.g., School of Engineering"
            className={cn(
              'h-10 rounded-none border-zinc-200 bg-white/50 text-sm transition-all',
              form.formState.errors.departmentName
                ? 'border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30'
                : 'hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50'
            )}
          />
          {form.formState.errors.departmentName && <p className="text-xs font-medium text-destructive">{form.formState.errors.departmentName.message}</p>}
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="department-code" className="text-sm font-semibold text-zinc-950">
            Department Code
          </Label>
          <Input
            id="department-code"
            {...form.register('departmentCode')}
            disabled={isLoading}
            placeholder="e.g., ENG"
            className={cn(
              'h-10 rounded-none border-zinc-200 bg-white/50 text-sm uppercase tracking-[0.12em] transition-all',
              form.formState.errors.departmentCode
                ? 'border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30'
                : 'hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50'
            )}
          />
          {form.formState.errors.departmentCode && <p className="text-xs font-medium text-destructive">{form.formState.errors.departmentCode.message}</p>}
        </div>
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
            <Layers className="size-4" />
            {initialData?.id ? 'Update Program' : 'Add Program'}
          </span>
        )}
      </Button>
    </form>
  );
}