import React from 'react';
import { Loader2, Save, ServerCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/adminSettings/useAdminSettings';
import type { UpdateSystemSettingsDto } from '@/api/adminSettings.api';

export const SystemConfigPanel: React.FC = () => {
  const settingsQuery = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const settings = settingsQuery.data;

  const [form, setForm] = React.useState({ systemName: '', academicYear: '', supportEmail: '' });

  React.useEffect(() => {
    if (settings) {
      setForm({
        systemName: settings.systemName ?? '',
        academicYear: settings.academicYear ?? '',
        supportEmail: settings.supportEmail ?? '',
      });
    }
  }, [settings]);

  if (settingsQuery.isLoading) return <Skeleton className="h-80 w-full" />;
  if (settingsQuery.isError || !settings) {
    return (
      <Card className="rounded-none border-rose-200 bg-rose-50 dark:border-rose-900/70 dark:bg-rose-950/25">
        <CardContent className="p-5 text-sm font-medium text-rose-700 dark:text-rose-300">Unable to load system settings.</CardContent>
      </Card>
    );
  }

  const formDirty = form.systemName !== (settings.systemName ?? '')
    || form.academicYear !== (settings.academicYear ?? '')
    || form.supportEmail !== (settings.supportEmail ?? '');

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const payload: UpdateSystemSettingsDto = {
      systemName: form.systemName.trim(),
      academicYear: form.academicYear.trim() || null,
      supportEmail: form.supportEmail.trim() || null,
    };
    updateSettings.mutate(payload);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/70">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            <ServerCog className="size-4 text-zinc-400" />
            System Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="system-name">System name</Label>
              <Input id="system-name" value={form.systemName} onChange={(event) => setForm((prev) => ({ ...prev, systemName: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic year</Label>
              <Input id="academic-year" placeholder="2025/2026" value={form.academicYear} onChange={(event) => setForm((prev) => ({ ...prev, academicYear: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">Support email</Label>
              <Input id="support-email" type="email" placeholder="support@uni.edu" value={form.supportEmail} onChange={(event) => setForm((prev) => ({ ...prev, supportEmail: event.target.value }))} />
            </div>
            <Button type="submit" disabled={!formDirty || updateSettings.isPending}>
              {updateSettings.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save system settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
