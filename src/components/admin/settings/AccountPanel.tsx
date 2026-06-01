import React from 'react';
import { Check, KeyRound, Loader2, LockKeyhole, UserCog } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAdminProfile, useChangeAdminPassword, useUpdateAdminProfile } from '@/hooks/adminSettings/useAdminSettings';
import { useAdminProfileSync } from '@/hooks/adminSettings/useAdminProfileSync';

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

const initialPasswordForm: PasswordForm = { currentPassword: '', newPassword: '', confirmNewPassword: '' };

export const AccountPanel: React.FC = () => {
  const { t } = useTranslation('common');
  const profileQuery = useAdminProfile();
  const updateProfile = useUpdateAdminProfile();
  const changePassword = useChangeAdminPassword();
  const { notifyProfileUpdate } = useAdminProfileSync();

  // Password rules dynamically based on translations
  const getPasswordRules = () => [
    { label: t('adminSettings.account.passwordRules.minLength'), test: (value: string) => value.length >= 8 },
    { label: t('adminSettings.account.passwordRules.casing'), test: (value: string) => /[A-Z]/.test(value) && /[a-z]/.test(value) },
    { label: t('adminSettings.account.passwordRules.number'), test: (value: string) => /[0-9]/.test(value) },
    { label: t('adminSettings.account.passwordRules.special'), test: (value: string) => /[^A-Za-z0-9]/.test(value) },
  ];

  const [profileForm, setProfileForm] = React.useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = React.useState<PasswordForm>(initialPasswordForm);

  React.useEffect(() => {
    if (profileQuery.data) {
      setProfileForm({ name: profileQuery.data.name, email: profileQuery.data.email });
    }
  }, [profileQuery.data]);

  const profileDirty = profileQuery.data
    && (profileForm.name !== profileQuery.data.name || profileForm.email !== profileQuery.data.email);

  const passwordRules = getPasswordRules();
  const passwordErrors = React.useMemo(() => {
    const errors: string[] = [];
    if (passwordForm.newPassword && passwordForm.newPassword === passwordForm.currentPassword) errors.push(t('adminSettings.account.passwordErrors.sameAsCurrent'));
    if (passwordForm.confirmNewPassword && passwordForm.newPassword !== passwordForm.confirmNewPassword) errors.push(t('adminSettings.account.passwordErrors.mismatch'));
    if (passwordForm.newPassword && passwordRules.some((rule) => !rule.test(passwordForm.newPassword))) errors.push(t('adminSettings.account.passwordErrors.doesNotMeetRules'));
    return errors;
  }, [passwordForm, passwordRules, t]);

  const canSubmitPassword = passwordForm.currentPassword
    && passwordForm.newPassword
    && passwordForm.confirmNewPassword
    && passwordErrors.length === 0
    && !changePassword.isPending;

  const isUniEmail = (email: string) => email.toLowerCase().endsWith('@uni.edu');
  const profileValid = profileForm.name.trim().length > 0 && isUniEmail(profileForm.email);

  const handleProfileSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!profileDirty || !profileValid) return;
    
    updateProfile.mutate({ name: profileForm.name, email: profileForm.email }, {
      onSuccess: () => {
        // Notify navbar and localStorage of profile update
        notifyProfileUpdate(profileForm.name, profileForm.email);
      }
    });
  };

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmitPassword) return;
    changePassword.mutate(
      { ...passwordForm, confirmNewPassword: passwordForm.confirmNewPassword },
      { onSuccess: () => setPasswordForm(initialPasswordForm) }
    );
  };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/70">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            <UserCog className="size-4 text-zinc-400" />
            {t('adminSettings.account.personalInfo.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">{t('adminSettings.account.personalInfo.fullName')}</Label>
              <Input id="admin-name" value={profileForm.name} onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">{t('adminSettings.account.personalInfo.email')}</Label>
              <Input
                id="admin-email"
                type="email"
                value={profileForm.email}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                className={cn(!isUniEmail(profileForm.email) && profileForm.email && "border-rose-500 focus-visible:ring-rose-500")}
              />
              {!isUniEmail(profileForm.email) && profileForm.email && (
                <p className="text-[10px] font-medium text-rose-500">Email must end with @uni.edu</p>
              )}
            </div>
            <Button type="submit" className="w-full rounded-none" disabled={!profileDirty || !profileValid || updateProfile.isPending}>
              {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {t('adminSettings.account.personalInfo.saveChanges')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/70">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            <KeyRound className="size-4 text-zinc-400" />
            {t('adminSettings.account.changePassword.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-current-password">{t('adminSettings.account.changePassword.currentPassword')}</Label>
              <Input id="admin-current-password" type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-new-password">{t('adminSettings.account.changePassword.newPassword')}</Label>
                <Input id="admin-new-password" type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-confirm-password">{t('adminSettings.account.changePassword.confirmPassword')}</Label>
                <Input id="admin-confirm-password" type="password" autoComplete="new-password" value={passwordForm.confirmNewPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmNewPassword: event.target.value }))} />
              </div>
            </div>

            <div className="space-y-2 rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/40">
              <p className="flex items-center gap-2 text-xs font-semibold text-zinc-950 dark:text-zinc-50">
                <LockKeyhole className="size-3.5 text-zinc-400" />
                {t('adminSettings.account.changePassword.requirements')}
              </p>
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

            {passwordErrors.length > 0 && (
              <div className="rounded-none border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-300">
                {passwordErrors[0]}
              </div>
            )}

            <Button type="submit" disabled={!canSubmitPassword}>
              {changePassword.isPending && <Loader2 className="size-4 animate-spin" />}
              {t('adminSettings.account.changePassword.updateButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
