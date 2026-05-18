import React from 'react';
import { Sparkles } from 'lucide-react';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-8 flex flex-col items-center space-y-3 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-white/35 bg-zinc-950/88 shadow-sm shadow-black/20">
        <Sparkles className="size-6 text-white" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow-sm">
          {title}
        </h1>
        <p className="text-[15px] text-white/72">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
