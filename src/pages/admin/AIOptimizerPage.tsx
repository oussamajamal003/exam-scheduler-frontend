import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sparkles, Brain, Gauge } from 'lucide-react';
import { PageSpinner } from '@/components/shared/PageSpinner';

export const AIOptimizerPage: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <PageSpinner label="Loading AI optimizer" />;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Card className="rounded-2xl border-zinc-200/80 bg-white/90 shadow-md shadow-zinc-200/40">
        <CardHeader className="px-4 py-5 sm:px-6 sm:py-6">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Sparkles className="size-5" />
            AI Optimizer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
          <p className="text-sm leading-6 text-zinc-600">Run AI-based evaluations and receive schedule quality recommendations.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button className="h-10 rounded-xl bg-zinc-950 text-white hover:bg-zinc-900">
              <Brain className="size-4 mr-2" />
              Run Evaluation
            </Button>
            <Button variant="outline" className="h-10 rounded-xl border-zinc-200 text-zinc-950 hover:bg-zinc-50">
              <Gauge className="size-4 mr-2" />
              Recalculate Score
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-zinc-200/80 bg-white/90 shadow-md shadow-zinc-200/40 overflow-hidden">
        <CardHeader className="px-4 py-5 sm:px-6 sm:py-6">
          <CardTitle className="text-lg sm:text-xl">Optimization Results</CardTitle>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-200/60 hover:bg-transparent">
                  <TableHead className="px-4 py-3 sm:px-6">Model</TableHead>
                  <TableHead className="px-4 py-3 sm:px-6">Run Time</TableHead>
                  <TableHead className="px-4 py-3 sm:px-6">Score</TableHead>
                  <TableHead className="px-4 py-3 sm:px-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-zinc-200/60 hover:bg-zinc-50/50">
                  <TableCell className="px-4 py-3 sm:px-6 font-medium text-zinc-950">Genetic Optimizer v2</TableCell>
                  <TableCell className="px-4 py-3 sm:px-6 text-zinc-600">2m 14s</TableCell>
                  <TableCell className="px-4 py-3 sm:px-6 text-zinc-600">91/100</TableCell>
                  <TableCell className="px-4 py-3 sm:px-6"><span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Completed</span></TableCell>
                </TableRow>
                <TableRow className="border-zinc-200/60 hover:bg-zinc-50/50">
                  <TableCell className="px-4 py-3 sm:px-6 font-medium text-zinc-950">Constraint Analyzer</TableCell>
                  <TableCell className="px-4 py-3 sm:px-6 text-zinc-600">1m 02s</TableCell>
                  <TableCell className="px-4 py-3 sm:px-6 text-zinc-600">88/100</TableCell>
                  <TableCell className="px-4 py-3 sm:px-6"><span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Completed</span></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
