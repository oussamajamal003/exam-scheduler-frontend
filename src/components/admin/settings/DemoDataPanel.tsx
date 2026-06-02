import React from 'react';
import { Database, Loader2, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClearDemoData, useGenerateDemoData } from '@/hooks/demoData/useDemoData';
import type { DemoDataSummary } from '@/api/demoDataApi';

type SummaryLabel = { key: keyof DemoDataSummary; label: string };
type DemoDatasetKey = 'A' | 'B' | 'C' | 'REAL' | 'FEIT2027';

export const DemoDataPanel: React.FC = () => {
  const { t } = useTranslation('common');
  
  const summaryLabels: SummaryLabel[] = [
    { key: 'departments', label: t('adminSettings.demoData.departments') },
    { key: 'programs', label: t('adminSettings.demoData.programs') },
    { key: 'semesters', label: t('adminSettings.demoData.semesters') },
    { key: 'courses', label: t('adminSettings.demoData.courses') },
    { key: 'courseOfferings', label: t('adminSettings.demoData.courseOfferings') },
    { key: 'registrations', label: t('adminSettings.demoData.registrations') },
    { key: 'students', label: t('adminSettings.demoData.students') },
    { key: 'centers', label: t('adminSettings.demoData.centers') },
    { key: 'rooms', label: t('adminSettings.demoData.rooms') },
    { key: 'proctors', label: t('adminSettings.demoData.proctors') },
    { key: 'timeSlots', label: t('adminSettings.demoData.timeSlots') },
    { key: 'exams', label: t('adminSettings.demoData.exams') },
    { key: 'schedules', label: t('adminSettings.demoData.schedules') },
  ];

  const datasetCards = [
    { key: 'A' as const, title: t('adminSettings.demoData.datasetA'), caption: t('adminSettings.demoData.datasetACaption'), detail: t('adminSettings.demoData.datasetADetail') },
    { key: 'B' as const, title: t('adminSettings.demoData.datasetB'), caption: t('adminSettings.demoData.datasetBCaption'), detail: t('adminSettings.demoData.datasetBDetail') },
    { key: 'C' as const, title: t('adminSettings.demoData.datasetC'), caption: t('adminSettings.demoData.datasetCCaption'), detail: t('adminSettings.demoData.datasetCDetail') },
    { key: 'REAL' as const, title: t('adminSettings.demoData.datasetREAL'), caption: t('adminSettings.demoData.datasetREALCaption'), detail: t('adminSettings.demoData.datasetREALDetail') },
    { key: 'FEIT2027' as const, title: t('adminSettings.demoData.datasetFEIT2027'), caption: t('adminSettings.demoData.datasetFEIT2027Caption'), detail: t('adminSettings.demoData.datasetFEIT2027Detail') },
  ] satisfies ReadonlyArray<{ key: DemoDatasetKey; title: string; caption: string; detail: string }>;

  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);
  const [selectedDataset, setSelectedDataset] = React.useState<DemoDatasetKey>('A');
  const [selectedClearDataset, setSelectedClearDataset] = React.useState<DemoDatasetKey>('A');
  const generateMutation = useGenerateDemoData();
  const clearMutation = useClearDemoData();
  const isBusy = generateMutation.isPending || clearMutation.isPending;
  const overallSummary = generateMutation.data?.overallSummary ?? clearMutation.data?.overallSummary ?? clearMutation.data?.summary;
  const expectedTestCases = generateMutation.data?.expectedTestCases;
  const generatedDataset = generateMutation.data?.datasetLabel;
  const selectedDatasetConfig = datasetCards.find((dataset) => dataset.key === selectedDataset) ?? datasetCards[0];
  const selectedClearDatasetConfig = datasetCards.find((dataset) => dataset.key === selectedClearDataset) ?? datasetCards[0];

  return (
    <>
      <Card className="max-w-4xl border-zinc-200 bg-white shadow-sm">
        <CardHeader className="gap-2 border-b border-zinc-100 pb-4">
          <CardTitle className="flex items-center gap-2 text-base text-zinc-950">
            <Database className="size-4" />
            {t('adminSettings.demoData.title')}
          </CardTitle>
          <CardDescription>
            {t('adminSettings.demoData.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          <div className="grid gap-3 text-xs text-zinc-600 sm:grid-cols-2">
            <div className="rounded-none border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="font-semibold text-zinc-900">{t('adminSettings.demoData.cleanSchedulePath')}</p>
              <p className="mt-1">{t('adminSettings.demoData.cleanSchedulePathDesc')}</p>
            </div>
            <div className="rounded-none border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="font-semibold text-zinc-900">{t('adminSettings.demoData.relationalCoverage')}</p>
              <p className="mt-1">{t('adminSettings.demoData.relationalCoverageDesc')}</p>
            </div>
            <div className="rounded-none border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="font-semibold text-zinc-900">{t('adminSettings.demoData.persistentDemoData')}</p>
              <p className="mt-1">{t('adminSettings.demoData.persistentDemoDataDesc')}</p>
            </div>
            <div className="rounded-none border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="font-semibold text-zinc-900">{t('adminSettings.demoData.safeCleanup')}</p>
              <p className="mt-1">{t('adminSettings.demoData.safeCleanupDesc')}</p>
            </div>
          </div>

          <div className="rounded-none border border-zinc-200 bg-zinc-50/60 p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{t('adminSettings.demoData.datasetChoice')}</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-950">{t('adminSettings.demoData.chooseDataset')}</p>
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
              <Button
                type="button"
                className="h-10 rounded-none bg-zinc-950 px-4 text-white hover:bg-zinc-900"
                disabled={isBusy}
                onClick={() => generateMutation.mutate({ dataset: selectedDataset })}
              >
                {generateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
                {t('adminSettings.demoData.generateSelectedDataset', { dataset: selectedDatasetConfig.title })}
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
            {generateMutation.isPending && (
              <div className="mt-4 flex items-center gap-3 rounded-none border border-zinc-200 bg-zinc-950 px-4 py-3 text-sm text-white">
                <Loader2 className="size-4 animate-spin" />
                <div>
                  <p className="font-semibold">{t('adminSettings.demoData.generationInProgress', { dataset: selectedDatasetConfig.title })}</p>
                  <p className="text-xs text-zinc-300">{t('adminSettings.demoData.generationInProgressDetail')}</p>
                </div>
              </div>
            )}
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
              {t('adminSettings.demoData.clearDemoData')}
            </Button>
          </div>

          {generateMutation.data && expectedTestCases && (
            <div className="space-y-2 rounded-none border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              <p className="font-semibold text-zinc-950">{generatedDataset} {t('adminSettings.demoData.ready')}</p>
              {expectedTestCases.expectedResult && <p>{expectedTestCases.expectedResult}</p>}
              {expectedTestCases.offerings && <p>{expectedTestCases.offerings}</p>}
              {expectedTestCases.rooms && <p>{expectedTestCases.rooms}</p>}
              {expectedTestCases.proctors && <p>{expectedTestCases.proctors}</p>}
            </div>
          )}

          {overallSummary && (
            <div className="rounded-none border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Summary</p>
              <div className="mt-3 grid gap-2">
                {summaryLabels.map((label) => {
                  const value = overallSummary[label.key] ?? 0;
                  return (
                    <div key={label.key} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-600">{label.label}</span>
                      <span className="font-semibold text-zinc-950">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear Demo Data confirmation dialog */}
      <Dialog open={confirmClearOpen} onOpenChange={(open) => { if (!open && !clearMutation.isPending) setConfirmClearOpen(false); }}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>{t('adminSettings.demoData.confirmClearTitle')}</DialogTitle>
            <DialogDescription>
              {t('adminSettings.demoData.confirmClearDescription', { dataset: selectedClearDatasetConfig.title })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 rounded-none border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-300">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <span>{t('adminSettings.demoData.clearWarning')}</span>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-none" disabled={clearMutation.isPending} onClick={() => setConfirmClearOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button type="button" variant="destructive" className="rounded-none" disabled={clearMutation.isPending} onClick={() => clearMutation.mutate({ dataset: selectedClearDataset })}>
              {clearMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {t('adminSettings.demoData.confirmClearButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
