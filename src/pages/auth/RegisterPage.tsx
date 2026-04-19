import React from 'react';
import { SignupForm } from '@/forms/auth/SignupForm';
import { PageSpinner } from '@/components/shared/PageSpinner';

export const RegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 500);
    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <PageSpinner label="Preparing registration" />;
  }

  return <SignupForm />;
};
