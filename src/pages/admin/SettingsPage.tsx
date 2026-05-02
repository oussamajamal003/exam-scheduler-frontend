import React from 'react';
import { Database, Loader2, RefreshCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClearDemoData, useGenerateDemoData } from '@/hooks/demoData/useDemoData';
import type { DemoDataSummary } from '@/api/demoDataApi';

const summaryLabels: Array<{ key: keyof DemoDataSummary; label: string }> = [
  { key: 'departments', label: 'Departments' },
  { key: 'programs', label: 'Programs' },
  { key: 'semesters', label: 'Semesters' },
  { key: 'courses', label: 'Courses' },
  { key: 'courseOfferings', label: 'Offerings' },
  { key: 'registrations', label: 'Enrollments' },
  { key: 'students', label: 'Students' },
  { key: 'centers', label: 'Centers' },
  { key: 'rooms', label: 'Rooms' },
  { key: 'supervisors', label: 'Supervisors' },
  { key: 'timeSlots', label: 'Time Slots' },
  { key: 'exams', label: 'Exams' },
];

export const SettingsPage: React.FC = () => {
  const generateMutation = useGenerateDemoData();
  const clearMutation = useClearDemoData();
  const isBusy = generateMutation.isPending || clearMutation.isPending;
  const summary = generateMutation.data?.summary ?? clearMutation.data?.summary;
  const expectedTestCases = generateMutation.data?.expectedTestCases ?? clearMutation.data?.expectedTestCases;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section className="flex flex-col gap-2 border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <Database className="size-4" />
          Demo Data
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">System Settings</h1>
        <p className="max-w-2xl text-sm text-zinc-600">
          Generate a large connected university dataset for Academic, Management, and Scheduling screens using the real backend APIs and Prisma schema.
        </p>
      </section>

      <Card className="max-w-4xl border-zinc-200 bg-white shadow-sm">
        <CardHeader className="gap-2 border-b border-zinc-100 pb-4">
          <CardTitle className="flex items-center gap-2 text-base text-zinc-950">
            <Database className="size-4" />
            Constraint Scheduling Demo Dataset
          </CardTitle>
          <CardDescription>
            Creates 500+ students, 40+ offerings, 800+ enrollments, 20+ rooms, supervisors, time slots, and guaranteed scheduling stress cases.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          <div className="grid gap-3 text-xs text-zinc-600 sm:grid-cols-3">
            <div className="rounded-none border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="font-semibold text-zinc-900">Normal schedule path</p>
              <p className="mt-1">Enough rooms, supervisors, and time slots for most exams.</p>
            </div>
            <div className="rounded-none border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="font-semibold text-zinc-900">Relational coverage</p>
              <p className="mt-1">Students connect to registrations, offerings, exams, and schedules.</p>
            </div>
            <div className="rounded-none border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="font-semibold text-amber-900">Conflict case included</p>
              <p className="mt-1 text-amber-800">Overcapacity, student overlap, supervisor limits, and long-duration exam cases.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="h-9 rounded-none bg-zinc-950 text-white hover:bg-zinc-900"
              disabled={isBusy}
              onClick={() => generateMutation.mutate()}
            >
              {generateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
              Generate Big Demo Dataset
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-none border-zinc-200"
              disabled={isBusy}
              onClick={() => clearMutation.mutate()}
            >
              {clearMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Clear Demo Data
            </Button>
          </div>

          {summary && (
            <div className="space-y-4 border-t border-zinc-100 pt-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {summaryLabels.map(({ key, label }) => (
                  <div key={key} className="rounded-none border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <p className="text-lg font-semibold tabular-nums text-zinc-950">{summary[key]}</p>
                    <p className="text-[11px] text-zinc-500">{label}</p>
                  </div>
                ))}
              </div>

              {expectedTestCases && (
                <div className="rounded-none border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                  <p className="font-semibold text-amber-950">Expected scheduling test cases</p>
                  <div className="mt-2 grid gap-1.5">
                    <p>Normal schedulable offerings: {expectedTestCases.normalSchedulableCount}</p>
                    <p>{expectedTestCases.overcapacityCourse}</p>
                    <p>{expectedTestCases.overlapStudentGroup}</p>
                    <p>{expectedTestCases.supervisorLimitedCase}</p>
                    <p>{expectedTestCases.invalidTimeSlotCase}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
