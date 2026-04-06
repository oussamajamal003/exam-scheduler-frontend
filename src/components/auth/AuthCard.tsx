import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface AuthCardProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, footer }) => {
  return (
    <Card className="w-full max-w-95 shadow-sm bg-white mx-auto border-slate-200">
      <CardContent className="pt-6 pb-6">
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="flex justify-center border-t border-slate-100 p-4 bg-slate-50 rounded-b-xl">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};
