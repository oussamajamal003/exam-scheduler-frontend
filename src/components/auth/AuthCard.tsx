import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface AuthCardProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, footer }) => {
  return (
    <Card className="overflow-hidden border-zinc-200/60 bg-white/80 shadow-xl shadow-zinc-200/40 backdrop-blur-xl transition-all">
      <CardContent className="p-8 pb-6">
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="flex flex-col items-center justify-center border-t border-zinc-100 bg-zinc-50/50 p-6">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};
