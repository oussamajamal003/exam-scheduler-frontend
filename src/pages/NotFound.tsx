import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const NotFound: React.FC = () => {
  return (
    <div className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <Card className="w-full max-w-lg rounded-none border-zinc-200 bg-white shadow-2xl shadow-zinc-950/8 dark:border-zinc-800 dark:bg-zinc-900/80 dark:shadow-black/30">
        <CardContent className="p-8 sm:p-10">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-none border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-300">
              <AlertTriangle className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">404 route missing</p>
              <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Page not found
              </h1>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                The page you requested is not available in this exam scheduling workspace.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-2 rounded-none border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/45">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <Search className="size-4 text-zinc-400" />
              <span>Check the URL or return to your dashboard.</span>
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-none" onClick={() => window.history.back()}>
              <ArrowLeft className="size-4" />
              Go Back
            </Button>
            <Button asChild className="rounded-none bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200">
              <Link to="/">
                <Home className="size-4" />
                Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
