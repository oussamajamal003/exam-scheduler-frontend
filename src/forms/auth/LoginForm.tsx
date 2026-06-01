import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { InputField } from '@/components/auth/InputField';
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth';
import { useLogin } from '@/hooks/auth/useLogin';

export const LoginForm: React.FC = () => {
  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <AuthCard>
      <AuthHeader title="Smart SIS" subtitle="Exam Operations, Scheduling & Optimization Platform" />

      <form onSubmit={handleSubmit((data) => login(data))} className="space-y-5" noValidate>
        {error && (
          <div className="rounded-xl border border-rose-300/30 bg-rose-500/12 p-3.5 text-[13px] font-medium text-rose-100 backdrop-blur-sm">
            {error.message || 'Invalid email or password. Please try again.'}
          </div>
        )}

        <InputField
          id="email"
          label="Email"
          type="email"
          placeholder="name@example.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <div className="space-y-1">
          <InputField
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
          />
        </div>

        <Button type="submit" disabled={isPending} className="auth-login-button h-11 w-full bg-zinc-950! text-white! font-semibold shadow-sm transition-all hover:bg-zinc-800! disabled:opacity-60 dark:bg-zinc-950! dark:text-white! dark:hover:bg-zinc-900!">
          {isPending ? 'Authenticating...' : 'Sign In'}
        </Button>
      </form>
    </AuthCard>
  );
};
