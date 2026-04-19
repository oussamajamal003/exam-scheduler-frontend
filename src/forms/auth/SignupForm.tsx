import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { InputField } from '@/components/auth/InputField';
import { signupSchema, type SignupFormValues } from '@/lib/validations/auth';
import { useSignup } from '@/hooks/auth/useSignup';

export const SignupForm: React.FC = () => {
  const { mutate: signup, isPending, error } = useSignup();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  return (
    <AuthCard
      footer={
        <div className="text-[13px] text-zinc-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-zinc-950 transition-colors hover:underline">
            Sign in
          </Link>
        </div>
      }
    >
      <AuthHeader title="Smart Exam Scheduler" subtitle="Let's get your account set up." />

      <form onSubmit={handleSubmit((data) => signup(data))} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-[13px] font-medium text-destructive">
            {error.response?.data?.message || error.message || 'Registration failed. Please try again.'}
          </div>
        )}

        <InputField id="name" label="Full Name" type="text" placeholder="John Doe" {...register('name')} error={errors.name?.message} />

        <InputField id="email" label="Email" type="email" placeholder="name@example.com" {...register('email')} error={errors.email?.message} />

        <InputField id="password" label="Password" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />

        <InputField
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        <Button type="submit" disabled={isPending} className="h-11 w-full bg-zinc-950 font-medium text-zinc-50 shadow-sm transition-all hover:bg-zinc-900 disabled:opacity-70">
          {isPending ? 'Processing...' : 'Create Account'}
        </Button>
      </form>
    </AuthCard>
  );
};
