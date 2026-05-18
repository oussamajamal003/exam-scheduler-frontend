import React from 'react';
import { Bell, Check, KeyRound, Loader2, LockKeyhole, Megaphone, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useChangeRolePassword, useRoleSettings, useUpdateRoleSettings } from '@/hooks/roleSettings/useRoleSettings';
import { cn } from '@/lib/utils';
import type { NotificationPreferences, RolePortal } from '@/api/roleSettings.api';

type TabKey = 'security' | 'notifications';

type RoleSettingsPageProps = {
  portal: RolePortal;
  roleName: 'Student' | 'Proctor';
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  logoutOtherSessions: boolean;
};

type PreferenceKey = keyof Pick<
  NotificationPreferences,
  'schedulePublishedNotifications' | 'examAssignmentUpdates' | 'roomTimeChanges' | 'announcementsMessages'
>;

const initialPasswordForm: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
  logoutOtherSessions: false,
};

const preferenceItems: Array<{
  key: PreferenceKey;
  title: string;
  description: string;
  icon: typeof Bell;
}> = [
  {
    key: 'schedulePublishedNotifications',
    title: 'Schedule published notifications',
    description: 'Receive updates when official published schedules become available.',
    icon: Bell,
  },
  {
    key: 'examAssignmentUpdates',
    title: 'Exam / assignment updates',
    description: 'Get notified when exams or assigned duties change.',
    icon: Sparkles,
  },
  {
    key: 'roomTimeChanges',
    title: 'Room and time changes',
    description: 'Receive urgent room, center, date, or time change alerts.',
    icon: KeyRound,
  },
  {
    key: 'announcementsMessages',
    title: 'Announcements and messages',
    description: 'Allow academic office announcements inside your dashboard.',
    icon: Megaphone,
  },
];

const passwordRules = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'Uppercase and lowercase letters', test: (value: string) => /[A-Z]/.test(value) && /[a-z]/.test(value) },
  { label: 'At least one number', test: (value: string) => /[0-9]/.test(value) },
  { label: 'At least one special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

const Toggle = ({ checked, disabled, onClick }: { checked: boolean; disabled?: boolean; onClick: () => void }) => (
  <label className={cn('relative inline-flex h-6 w-11 shrink-0 items-center', disabled && 'cursor-not-allowed opacity-60')}>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onClick}
      aria-label={checked ? 'Turn off' : 'Turn on'}
      className="sr-only"
    />
    <span
      aria-hidden="true"
      className={cn(
        'absolute inset-0 rounded-full border transition-colors',
        checked
          ? 'border-zinc-950 bg-zinc-950 dark:border-zinc-100 dark:bg-zinc-100'
          : 'border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900'
      )}
    />
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-block size-4 rounded-full bg-white shadow-sm transition-transform dark:bg-zinc-950',
        checked ? 'translate-x-6' : 'translate-x-1'
      )}
    />
  </label>
);

const TabButton = ({ active, icon: Icon, children, onClick }: { active: boolean; icon: typeof ShieldCheck; children: React.ReactNode; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex h-10 items-center justify-center gap-2 rounded-none border px-4 text-xs font-semibold transition-colors',
      active
        ? 'border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
        : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900'
    )}
  >
    <Icon className="size-4" />
    {children}
  </button>
);

const SettingsSkeleton = () => (
  <div className="space-y-5 p-5 sm:p-6 lg:p-8">
    <Skeleton className="h-8 w-72" />
    <Skeleton className="h-10 w-80" />
    <Skeleton className="h-80 w-full" />
  </div>
);

export const RoleSettingsPage: React.FC<RoleSettingsPageProps> = ({ portal, roleName }) => {
  const [activeTab, setActiveTab] = React.useState<TabKey>('security');
  const [passwordForm, setPasswordForm] = React.useState<PasswordForm>(initialPasswordForm);
  const settingsQuery = useRoleSettings(portal);
  const updateSettings = useUpdateRoleSettings(portal);
  const changePassword = useChangeRolePassword(portal);

  const settings = settingsQuery.data;
  const passwordErrors = React.useMemo(() => {
    const errors: string[] = [];
    if (passwordForm.newPassword && passwordForm.newPassword === passwordForm.currentPassword) errors.push('New password must be different from the current password.');
    if (passwordForm.confirmNewPassword && passwordForm.newPassword !== passwordForm.confirmNewPassword) errors.push('Password confirmation does not match.');
    if (passwordForm.newPassword && passwordRules.some((rule) => !rule.test(passwordForm.newPassword))) errors.push('New password does not meet all rules.');
    return errors;
  }, [passwordForm]);

  const canSubmitPassword = passwordForm.currentPassword
    && passwordForm.newPassword
    && passwordForm.confirmNewPassword
    && passwordErrors.length === 0
    && !changePassword.isPending;

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmitPassword) return;
    changePassword.mutate(passwordForm, {
      onSuccess: () => setPasswordForm(initialPasswordForm),
    });
  };

  const togglePreference = (key: PreferenceKey) => {
    if (!settings) return;
    updateSettings.mutate({ [key]: !settings[key] });
  };

  if (settingsQuery.isLoading) return <SettingsSkeleton />;

  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">{roleName} Settings</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Account security and notifications</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Manage your password and the alerts that matter for your exam workflow.
          </p>
        </div>
        <Badge variant="secondary">{roleName} portal only</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton active={activeTab === 'security'} icon={ShieldCheck} onClick={() => setActiveTab('security')}>Security</TabButton>
        <TabButton active={activeTab === 'notifications'} icon={Bell} onClick={() => setActiveTab('notifications')}>Notifications</TabButton>
      </div>

      {settingsQuery.isError ? (
        <Card className="rounded-none border-rose-200 bg-rose-50 dark:border-rose-900/70 dark:bg-rose-950/25">
          <CardContent className="p-5 text-sm font-medium text-rose-700 dark:text-rose-300">Unable to load settings.</CardContent>
        </Card>
      ) : activeTab === 'security' ? (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/70">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                <LockKeyhole className="size-4 text-zinc-400" />
                Security status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/40">
                <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Password protected account</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">Your password is validated server-side and stored using bcrypt hashing.</p>
              </div>
              <div className="space-y-2">
                {passwordRules.map((rule) => {
                  const met = rule.test(passwordForm.newPassword);
                  return (
                    <div key={rule.label} className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className={cn('flex size-4 items-center justify-center rounded-full border', met ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-700')}>
                        {met && <Check className="size-3" />}
                      </span>
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/70">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                <KeyRound className="size-4 text-zinc-400" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`${portal}-current-password`}>Current Password</Label>
                    <Input id={`${portal}-current-password`} type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${portal}-new-password`}>New Password</Label>
                    <Input id={`${portal}-new-password`} type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${portal}-confirm-password`}>Confirm New Password</Label>
                    <Input id={`${portal}-confirm-password`} type="password" autoComplete="new-password" value={passwordForm.confirmNewPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmNewPassword: event.target.value }))} />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/40">
                  <span>
                    <span className="block text-sm font-semibold text-zinc-950 dark:text-zinc-50">Logout other sessions</span>
                    <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">Stored for compatibility if session invalidation is added later.</span>
                  </span>
                  <Toggle checked={passwordForm.logoutOtherSessions} onClick={() => setPasswordForm((prev) => ({ ...prev, logoutOtherSessions: !prev.logoutOtherSessions }))} />
                </div>

                {passwordErrors.length > 0 && (
                  <div className="rounded-none border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-300">
                    {passwordErrors[0]}
                  </div>
                )}

                <Button type="submit" disabled={!canSubmitPassword}>
                  {changePassword.isPending && <Loader2 className="size-4 animate-spin" />}
                  Update password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/70">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              <Bell className="size-4 text-zinc-400" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-5 lg:grid-cols-2">
            {settings && preferenceItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex items-center justify-between gap-4 rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/40">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-none bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{item.description}</p>
                    </div>
                  </div>
                  <Toggle checked={settings[item.key]} disabled={updateSettings.isPending} onClick={() => togglePreference(item.key)} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
