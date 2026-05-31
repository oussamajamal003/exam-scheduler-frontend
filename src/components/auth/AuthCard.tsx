import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface AuthCardProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, footer }) => {
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/30 bg-white/10! shadow-2xl shadow-black/18 backdrop-blur-sm transition-all">
      <CardContent className="p-8 pb-6">
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="flex flex-col items-center justify-center border-t border-white/20 bg-white/6 p-6">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};
