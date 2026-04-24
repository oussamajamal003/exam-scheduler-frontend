import React from 'react';
import { Outlet } from 'react-router-dom';
import { SplashScreen } from '@/components/shared/SplashScreen';
import { PageSpinner } from '@/components/shared/PageSpinner';

const SPLASH_SEEN_KEY = 'sis-auth-splash-seen';
const OPEN_TAB_COUNT_KEY = 'sis-auth-open-tabs';
const LAST_CLOSE_AT_KEY = 'sis-auth-last-close-at';
const TAB_REGISTERED_KEY = 'sis-auth-tab-registered';

const getOpenTabCount = () => {
  const count = Number(localStorage.getItem(OPEN_TAB_COUNT_KEY));
  return Number.isFinite(count) && count > 0 ? count : 0;
};

export const AuthLayout: React.FC = () => {
  const [shouldShowIntro] = React.useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const lastCloseAt = Number(localStorage.getItem(LAST_CLOSE_AT_KEY));
    if (Number.isFinite(lastCloseAt) && lastCloseAt > 0 && Date.now() - lastCloseAt > 2000) {
      localStorage.removeItem(SPLASH_SEEN_KEY);
    }

    return localStorage.getItem(SPLASH_SEEN_KEY) !== 'true';
  });

  const [stage, setStage] = React.useState<'spinner' | 'splash' | 'content'>(shouldShowIntro ? 'spinner' : 'content');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    if (sessionStorage.getItem(TAB_REGISTERED_KEY) !== 'true') {
      localStorage.setItem(OPEN_TAB_COUNT_KEY, String(getOpenTabCount() + 1));
      sessionStorage.setItem(TAB_REGISTERED_KEY, 'true');
    }

    return () => {
      if (sessionStorage.getItem(TAB_REGISTERED_KEY) !== 'true') return;

      const nextCount = Math.max(0, getOpenTabCount() - 1);
      localStorage.setItem(OPEN_TAB_COUNT_KEY, String(nextCount));

      if (nextCount === 0) {
        localStorage.setItem(LAST_CLOSE_AT_KEY, String(Date.now()));
      }

      sessionStorage.removeItem(TAB_REGISTERED_KEY);
    };
  }, []);

  React.useEffect(() => {
    if (!shouldShowIntro) return;

    localStorage.setItem(SPLASH_SEEN_KEY, 'true');

    const splashTimer = window.setTimeout(() => {
      setStage('splash');
    }, 1000);

    const contentTimer = window.setTimeout(() => {
      setStage('content');
    }, 2700);

    return () => {
      window.clearTimeout(splashTimer);
      window.clearTimeout(contentTimer);
    };
  }, [shouldShowIntro]);

  if (stage === 'spinner') {
    return (
      <div className="relative grid min-h-screen place-items-center bg-zinc-50 p-4 selection:bg-zinc-200">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-200/50 via-zinc-50 to-zinc-50" />
        <PageSpinner label="Opening secure workspace" />
      </div>
    );
  }

  if (stage === 'splash') {
    return <SplashScreen />;
  }

  return (
    <div className="relative grid min-h-screen place-items-center bg-zinc-50 p-4 selection:bg-zinc-200">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-200/50 via-zinc-50 to-zinc-50" />
      <div className="w-full max-w-105 animate-in zoom-in-95 fade-in duration-500">
        <Outlet />
      </div>
    </div>
  );
};
