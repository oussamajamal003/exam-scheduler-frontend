import React from 'react';
import { Database, ShieldCheck, Users, UserCog } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TabButton } from '@/components/admin/settings/SettingsPrimitives';
import { AccountPanel } from '@/components/admin/settings/AccountPanel';
import { UserAccountsPanel } from '@/components/admin/settings/UserAccountsPanel';
import { DemoDataPanel } from '@/components/admin/settings/DemoDataPanel';

type TabKey = 'account' | 'accounts' | 'data';

const tabs: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'account', label: 'Account', icon: UserCog },
  { key: 'accounts', label: 'User Accounts', icon: Users },
  { key: 'data', label: 'Demo Data', icon: Database },
];

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation('common');
  // Persist active tab to localStorage
  const [activeTab, setActiveTab] = React.useState<TabKey>(() => {
    const stored = localStorage.getItem('admin-settings-tab');
    if (stored === 'account' || stored === 'accounts' || stored === 'data') {
      return stored;
    }
    return 'account';
  });

  React.useEffect(() => {
    localStorage.setItem('admin-settings-tab', activeTab);
  }, [activeTab]);

  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      <section className="flex flex-col gap-2 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="size-4" />
          {t('adminSettings.header')}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{t('adminSettings.title')}</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          {t('adminSettings.description')}
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <TabButton key={tab.key} active={activeTab === tab.key} icon={tab.icon} onClick={() => setActiveTab(tab.key)}>
            {t(`adminSettings.tabs.${tab.key}`)}
          </TabButton>
        ))}
      </div>

      {activeTab === 'account' && <AccountPanel />}
      {activeTab === 'accounts' && <UserAccountsPanel />}
      {activeTab === 'data' && <DemoDataPanel />}
    </div>
  );
};
