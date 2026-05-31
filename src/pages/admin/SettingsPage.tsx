import React from 'react';
import { Database, Loader2, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  { key: 'proctors', label: 'Proctors' },
  { key: 'timeSlots', label: 'Time Slots' },
  { key: 'exams', label: 'Exams' },
  { key: 'schedules', label: 'Schedules' },
];

const datasetCards = [
  {
    key: 'A' as const,
    title: 'Dataset A',
    caption: 'Balanced baseline',
    detail: '18 offerings, 4 centers, 10 rooms, and a fully feasible balanced scheduling workload.',
  },
  {
    key: 'B' as const,
    title: 'Dataset B',
    caption: 'Scaled 40+ offerings',
    detail: '44 offerings with more students, more campuses, more proctors, and a wider feasible time-slot grid.',
  },
  {
    key: 'C' as const,
    title: 'Dataset C',
    caption: 'Largest 55+ offerings',
    detail: '60 offerings with the highest realistic scale, expanded rooms, centers, enrollments, and proctor coverage.',
  },
  {
    key: 'REAL' as const,
    title: 'Real Data',
    caption: 'FEIT Spring 2026',
    detail: 'Real FEIT Spring 2026 course offerings: 35 offerings (29 producing exams), real instructors, sections, lecture day/time, BME / CCE / CS / EE programs, 4 FEIT centers, and 12 rooms. PROJECT and LAB-only offerings keep their CourseOffering but do NOT generate exams or join scheduling.',
  },
];

export const SettingsPage: React.FC = () => {
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);
  const [selectedDataset, setSelectedDataset] = React.useState<'A' | 'B' | 'C' | 'REAL'>('A');
  const [selectedClearDataset, setSelectedClearDataset] = React.useState<'A' | 'B' | 'C' | 'REAL'>('A');
  const generateMutation = useGenerateDemoData();
  const clearMutation = useClearDemoData();
  const isBusy = generateMutation.isPending || clearMutation.isPending;
  const summary = generateMutation.data?.summary;
  const overallSummary = generateMutation.data?.overallSummary ?? clearMutation.data?.overallSummary ?? clearMutation.data?.summary;
  const expectedTestCases = generateMutation.data?.expectedTestCases;
  const generatedDataset = generateMutation.data?.datasetLabel;
  const selectedDatasetConfig = datasetCards.find((dataset) => dataset.key === selectedDataset) ?? datasetCards[0];
  const selectedClearDatasetConfig = datasetCards.find((dataset) => dataset.key === selectedClearDataset) ?? datasetCards[0];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section className="flex flex-col gap-2 border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <Database className="size-4" />
          Demo Data
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">System Settings</h1>
        <p className="max-w-2xl text-sm text-zinc-600">
          Generate multiple persistent feasible demo datasets for Academic, Management, Scheduling, Calendar, and Assignments screens using the real backend APIs and Prisma schema.
        </p>
      </section>

      <Card className="max-w-4xl border-zinc-200 bg-white shadow-sm">
        <CardHeader className="gap-2 border-b border-zinc-100 pb-4">
          <CardTitle className="flex items-center gap-2 text-base text-zinc-950">
            <Database className="size-4" />
            Constraint Scheduling Demo Dataset
          </CardTitle>
          <CardDescription>
            Generate persistent feasible datasets A, B, and C. Regeneration preserves existing schedules, and Clear Demo Data removes the selected demo dataset only when an admin explicitly confirms it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          <div className="grid gap-3 text-xs text-zinc-600 sm:grid-cols-2">
            <div className="rounded-none border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="font-semibold text-zinc-900">Clean schedule path</p>
              <p className="mt-1">Each dataset is sized to remain feasible for the Hybrid Constraint-Based Scheduling Algorithm.</p>
            </div>
            <div className="rounded-none border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="font-semibold text-zinc-900">Relational coverage</p>
              <p className="mt-1">Students connect to registrations, offerings, exams, schedules, assignments, and the calendar view.</p>
            </div>
            <div className="rounded-none border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="font-semibold text-zinc-900">Persistent demo data</p>
              <p className="mt-1">Datasets stay in the database across refreshes and restarts until an admin explicitly clears demo data.</p>
            </div>
            <div className="rounded-none border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="font-semibold text-zinc-900">Safe cleanup</p>
              <p className="mt-1">Clear Demo Data removes the selected demo dataset, its schedules, assignments, and related demo entities without touching manually created records outside that dataset.</p>
            </div>
          </div>

          <div className="rounded-none border border-zinc-200 bg-zinc-50/60 p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Dataset Choice</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-950">Choose between dataset A, B, C, or the FEIT Real Data before generation.</p>
                </div>
                <div className="inline-flex w-full flex-wrap items-center rounded-none border border-zinc-200 bg-white p-1 shadow-sm lg:w-auto">
                  {datasetCards.map((dataset) => {
                    const isActive = dataset.key === selectedDataset;
                    return (
                      <button
                        key={dataset.key}
                        type="button"
                        disabled={isBusy}
                        onClick={() => setSelectedDataset(dataset.key)}
                        className={[
                          "inline-flex min-w-20 items-center justify-center rounded-none px-4 py-2 text-xs font-semibold transition-colors",
                          isActive ? "bg-zinc-950 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950",
                        ].join(" ")}
                      >
                        {dataset.title}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button
                type="button"
                className="h-10 rounded-none bg-zinc-950 px-4 text-white hover:bg-zinc-900"
                disabled={isBusy}
                onClick={() => generateMutation.mutate({ dataset: selectedDataset })}
              >
                {generateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
                Generate {selectedDatasetConfig.title}
              </Button>
            </div>
            <div className="mt-4 flex items-start justify-between gap-3 rounded-none border border-zinc-200 bg-white px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{selectedDatasetConfig.title}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-950">{selectedDatasetConfig.caption}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-600">{selectedDatasetConfig.detail}</p>
              </div>
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-none border border-zinc-200 bg-zinc-50 text-zinc-700 shadow-sm">
                <ShieldCheck className="size-4" />
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-none border-zinc-200"
              disabled={isBusy}
              onClick={() => {
                setSelectedClearDataset(selectedDataset);
                setConfirmClearOpen(true);
              }}
            >
              {clearMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Clear Demo Data
            </Button>
          </div>

          {generateMutation.data && expectedTestCases && (
            <div className="space-y-2 rounded-none border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              <p className="font-semibold text-zinc-950">
                {generatedDataset} ready
              </p>
              {expectedTestCases.expectedResult && <p>{expectedTestCases.expectedResult}</p>}
              {expectedTestCases.offerings && <p>{expectedTestCases.offerings}</p>}
              {expectedTestCases.rooms && <p>{expectedTestCases.rooms}</p>}
              {expectedTestCases.proctors && <p>{expectedTestCases.proctors}</p>}
              {expectedTestCases.timeSlots && <p>{expectedTestCases.timeSlots}</p>}
              {generateMutation.data.instruction && <p>{generateMutation.data.instruction}</p>}
            </div>
          )}

          {summary && (
            <div className="space-y-4 border-t border-zinc-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Last Generated Dataset</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {summaryLabels.map(({ key, label }) => (
                  <div key={key} className="rounded-none border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <p className="text-lg font-semibold tabular-nums text-zinc-950">{summary[key] ?? 0}</p>
                    <p className="text-[11px] text-zinc-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {overallSummary && (
            <div className="space-y-4 border-t border-zinc-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">All Persisted Demo Data</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {summaryLabels.map(({ key, label }) => (
                  <div key={`overall-${key}`} className="rounded-none border border-zinc-200 bg-white px-3 py-2">
                    <p className="text-lg font-semibold tabular-nums text-zinc-950">{overallSummary[key] ?? 0}</p>
                    <p className="text-[11px] text-zinc-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmClearOpen} onOpenChange={(next) => { if (!clearMutation.isPending) setConfirmClearOpen(next); }}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>Clear Demo Data</DialogTitle>
            <DialogDescription>
              Choose which demo dataset to clear. The related schedules must already be deleted from Schedule Versions before this dataset can be removed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Dataset To Clear</p>
            <div className="inline-flex w-full flex-wrap items-center rounded-none border border-zinc-200 bg-white p-1 shadow-sm">
              {datasetCards.map((dataset) => {
                const isActive = dataset.key === selectedClearDataset;
                return (
                  <button
                    key={`clear-${dataset.key}`}
                    type="button"
                    disabled={clearMutation.isPending}
                    onClick={() => setSelectedClearDataset(dataset.key)}
                    className={[
                      'inline-flex min-w-20 items-center justify-center rounded-none px-4 py-2 text-xs font-semibold transition-colors',
                      isActive ? 'bg-zinc-950 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950',
                    ].join(' ')}
                  >
                    {dataset.title}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-none border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800">
            Delete the related schedule first from Schedule Versions. After that, {selectedClearDatasetConfig.title} can be removed together with its assignments, enrollments, rooms, proctors, time slots, and related demo-generated records.
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-none"
              disabled={clearMutation.isPending}
              onClick={() => setConfirmClearOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-none"
              disabled={clearMutation.isPending}
              onClick={() => clearMutation.mutate({ dataset: selectedClearDataset }, {
                onSuccess: () => setConfirmClearOpen(false),
              })}
            >
              {clearMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Clear {selectedClearDatasetConfig.title}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
