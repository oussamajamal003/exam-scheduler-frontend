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
        <div className="text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors">
            Sign in
          </Link>
        </div>
      }
    >
      <AuthHeader title="Exam Scheduling System" subtitle="Create your account" />

      <form onSubmit={handleSubmit((data) => signup(data))} className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
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

        <Button type="submit" disabled={isPending} className="w-full bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-70">
          {isPending ? 'Signing up...' : 'Sign Up'}
        </Button>
      </form>
    </AuthCard>
  );
};
