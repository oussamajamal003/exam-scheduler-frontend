import React from 'react';
import { Loader2, LockKeyhole } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChangeRolePassword } from '@/hooks/roleSettings/useRoleSettings';
import { cn } from '@/lib/utils';
import type { RolePortal } from '@/api/roleSettings.api';

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

const initialPasswordForm: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
  logoutOtherSessions: false,
};

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

export const RoleSettingsPage: React.FC<RoleSettingsPageProps> = ({ portal, roleName }) => {
  const [passwordForm, setPasswordForm] = React.useState<PasswordForm>(initialPasswordForm);
  const changePassword = useChangeRolePassword(portal);

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

  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">{roleName} Settings</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Security</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Manage your password for this workspace.
          </p>
        </div>
        <Badge variant="secondary">{roleName} portal only</Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-1">
        <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/70">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              <LockKeyhole className="size-4 text-zinc-400" />
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
    </div>
  );
};