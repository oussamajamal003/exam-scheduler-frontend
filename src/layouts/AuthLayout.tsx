import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="relative grid min-h-screen place-items-center bg-zinc-50 p-4 selection:bg-zinc-200">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-200/50 via-zinc-50 to-zinc-50" />
      <div className="w-full max-w-105 animate-in zoom-in-95 fade-in duration-500">
        <Outlet />
      </div>
    </div>
  );
};
