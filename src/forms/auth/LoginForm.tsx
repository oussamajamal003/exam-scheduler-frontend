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
        <div className="text-sm text-slate-500">
          Don’t have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors">
            Sign up
          </Link>
        </div>
      }
    >
      <AuthHeader title="Exam Scheduling System" subtitle="Login to your account" />

      <form onSubmit={handleSubmit((data) => login(data))} className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
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
          <div className="flex justify-end pt-1">
            <Link to="/forgot-password" className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="w-full bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-70">
          {isPending ? 'Signing in...' : 'Login'}
        </Button>
      </form>
    </AuthCard>
  );
};
