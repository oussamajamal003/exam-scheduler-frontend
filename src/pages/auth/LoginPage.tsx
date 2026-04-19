import React from 'react';
import { LoginForm } from '@/forms/auth/LoginForm';
import { SplashScreen } from '@/components/shared/SplashScreen';

export const LoginPage: React.FC = () => {
  const [showSplash, setShowSplash] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sis-login-splash-seen') !== 'true';
  });

  React.useEffect(() => {
    if (!showSplash) return;

    const timer = window.setTimeout(() => {
      localStorage.setItem('sis-login-splash-seen', 'true');
      setShowSplash(false);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [showSplash]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return <LoginForm />;
};
