import React from 'react';
import { LoginForm } from '@/forms/auth/LoginForm';
import { PageSpinner } from '@/components/shared/PageSpinner';
import { useLocation } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const fromSignup = Boolean((location.state as { fromSignup?: boolean } | null)?.fromSignup);
  const [stage, setStage] = React.useState<'spinner' | 'form'>(fromSignup ? 'spinner' : 'form');

  React.useEffect(() => {
    if (!fromSignup || stage === 'form') return;

    const timer = window.setTimeout(() => {
      setStage('form');
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [fromSignup, stage]);

  if (stage === 'spinner') {
    return <PageSpinner label="Preparing sign in" />;
  }

  return <LoginForm />;
};
