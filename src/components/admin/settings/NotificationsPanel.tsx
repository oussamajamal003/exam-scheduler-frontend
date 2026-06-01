import React from 'react';
import { Bell, KeyRound, Megaphone, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleRow } from './SettingsPrimitives';
import { useAdminNotifications, useUpdateAdminNotifications } from '@/hooks/adminSettings/useAdminSettings';
import type { NotificationPreferences } from '@/api/adminSettings.api';

type PreferenceKey = keyof Pick<
  NotificationPreferences,
  'schedulePublishedNotifications' | 'examAssignmentUpdates' | 'roomTimeChanges' | 'announcementsMessages'
>;

const items: Array<{ key: PreferenceKey; title: string; description: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'schedulePublishedNotifications', title: 'In-app schedule notifications', description: 'Receive in-app alerts when published schedules become available.', icon: Bell },
  { key: 'examAssignmentUpdates', title: 'Exam & assignment updates', description: 'Get notified when exams or assignments change.', icon: Sparkles },
  { key: 'roomTimeChanges', title: 'Reminder notifications', description: 'Receive room, center, date, and time change reminders.', icon: KeyRound },
  { key: 'announcementsMessages', title: 'Announcements & messages', description: 'Allow academic office announcements inside your dashboard.', icon: Megaphone },
];

export const NotificationsPanel: React.FC = () => {
  const settingsQuery = useAdminNotifications();
  const updateSettings = useUpdateAdminNotifications();
  const settings = settingsQuery.data;

  if (settingsQuery.isLoading) return <Skeleton className="h-72 w-full" />;
  if (settingsQuery.isError || !settings) {
    return (
      <Card className="rounded-none border-rose-200 bg-rose-50 dark:border-rose-900/70 dark:bg-rose-950/25">
        <CardContent className="p-5 text-sm font-medium text-rose-700 dark:text-rose-300">Unable to load notification preferences.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
      <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/70">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          <Bell className="size-4 text-zinc-400" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-5 lg:grid-cols-2">
        {items.map((item) => (
          <ToggleRow
            key={item.key}
            icon={item.icon}
            title={item.title}
            description={item.description}
            checked={settings[item.key]}
            disabled={updateSettings.isPending}
            onToggle={() => updateSettings.mutate({ [item.key]: !settings[item.key] })}
          />
        ))}
      </CardContent>
    </Card>
  );
};
