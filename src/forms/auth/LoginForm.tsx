import React from 'react';
import { Link } from 'react-router-dom';
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
    <AuthCard
      footer={
        <div className="text-[13px] text-zinc-500">
          Don’t have an account?{' '}
          <Link to="/register" className="font-medium text-zinc-950 transition-colors hover:underline">
            Sign up
          </Link>
        </div>
      }
    >
      <AuthHeader title="Smart Exam Scheduler" subtitle="Welcome back. Please enter your details." />

      <form onSubmit={handleSubmit((data) => login(data))} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-[13px] font-medium text-destructive">
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
          <div className="flex justify-end pt-2">
            <Link to="/forgot-password" className="text-[13px] font-medium text-zinc-600 transition-colors hover:text-zinc-950">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="h-11 w-full bg-zinc-950 font-medium text-zinc-50 shadow-sm transition-all hover:bg-zinc-900 disabled:opacity-70">
          {isPending ? 'Authenticating...' : 'Sign In'}
        </Button>
      </form>
    </AuthCard>
  );
};
