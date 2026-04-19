import React from 'react';
import { Sparkles } from 'lucide-react';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-8 flex flex-col items-center space-y-3 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-950 shadow-sm">
        <Sparkles className="size-6 text-zinc-50" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          {title}
        </h1>
        <p className="text-[15px] text-zinc-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
