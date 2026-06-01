import React from 'react';
import { GraduationCap, Loader2, Pencil, Search, ShieldAlert, Trash2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useDeleteUserAccount, useUpdateUserAccount, useUserAccounts } from '@/hooks/adminSettings/useAdminSettings';
import type { UpdateAccountDto, UserAccount } from '@/api/adminSettings.api';

type RoleFilter = 'ALL' | 'STUDENT' | 'PROCTOR';

export const UserAccountsPanel: React.FC = () => {
  const { t } = useTranslation('common');
  
  const roleFilters: Array<{ key: RoleFilter; label: string }> = [
    { key: 'ALL', label: t('adminSettings.userAccounts.filters.allRoles') },
    { key: 'STUDENT', label: t('adminSettings.userAccounts.filters.students') },
    { key: 'PROCTOR', label: t('adminSettings.userAccounts.filters.proctors') },
  ];

  const roleBadge = (role: UserAccount['role']) => {
    if (role === 'STUDENT') return <Badge variant="secondary">{t('adminSettings.userAccounts.roles.student')}</Badge>;
    if (role === 'PROCTOR') return <Badge variant="secondary">{t('adminSettings.userAccounts.roles.proctor')}</Badge>;
    return <Badge variant="default">{t('adminSettings.userAccounts.roles.admin')}</Badge>;
  };
  const [roleFilter, setRoleFilter] = React.useState<RoleFilter>('ALL');
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);

  const [editTarget, setEditTarget] = React.useState<UserAccount | null>(null);
  const [editForm, setEditForm] = React.useState<UpdateAccountDto>({});
  const [deleteTarget, setDeleteTarget] = React.useState<UserAccount | null>(null);

  React.useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const params = React.useMemo(
    () => ({ role: roleFilter === 'ALL' ? undefined : roleFilter, search: search || undefined, page, limit: 10 }),
    [roleFilter, search, page]
  );

  const accountsQuery = useUserAccounts(params);
  const updateAccount = useUpdateUserAccount();
  const deleteAccount = useDeleteUserAccount();

  const accounts = accountsQuery.data?.data ?? [];
  const meta = accountsQuery.data?.meta;

  const openEdit = (account: UserAccount) => {
    setEditTarget(account);
    setEditForm({
      name: account.name,
      email: account.email,
      ...(account.role === 'PROCTOR'
        ? { department: account.department ?? '', maxExamsPerDay: account.maxExamsPerDay ?? 2 }
        : {}),
    });
  };

  const submitEdit = () => {
    if (!editTarget) return;
    updateAccount.mutate(
      { userId: editTarget.id, data: editForm },
      { onSuccess: () => setEditTarget(null) }
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteAccount.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
      <CardHeader className="gap-3 border-b border-zinc-100 dark:border-zinc-800/70">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          <Users className="size-4 text-zinc-400" />
          {t('adminSettings.userAccounts.title')}
        </CardTitle>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex flex-wrap items-center rounded-none border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950">
            {roleFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => { setRoleFilter(filter.key); setPage(1); }}
                className={cn(
                  'inline-flex min-w-20 items-center justify-center rounded-none px-4 py-1.5 text-xs font-semibold transition-colors',
                  roleFilter === filter.key ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input className="pl-9" placeholder={t('adminSettings.userAccounts.search')} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {accountsQuery.isLoading ? (
          <div className="space-y-2 p-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : accountsQuery.isError ? (
          <div className="p-5 text-sm font-medium text-rose-600">{t('adminSettings.userAccounts.error')}</div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <GraduationCap className="size-6 text-zinc-400" />
            {t('adminSettings.userAccounts.noAccounts')}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('adminSettings.userAccounts.name')}</TableHead>
                <TableHead>{t('adminSettings.userAccounts.email')}</TableHead>
                <TableHead>{t('adminSettings.userAccounts.role')}</TableHead>
                <TableHead>{t('adminSettings.userAccounts.reference')}</TableHead>
                <TableHead className="text-right">{t('adminSettings.userAccounts.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium text-zinc-950 dark:text-zinc-50">{account.name}</TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-300">{account.email}</TableCell>
                  <TableCell>{roleBadge(account.role)}</TableCell>
                  <TableCell className="text-xs text-zinc-500 dark:text-zinc-400">
                    {account.role === 'STUDENT'
                      ? account.universityId ?? '—'
                      : account.role === 'PROCTOR'
                        ? account.department ?? '—'
                        : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" className="rounded-none" onClick={() => openEdit(account)}>
                        <Pencil className="size-3.5" />
                        {t('adminSettings.userAccounts.edit')}
                      </Button>
                      <Button type="button" variant="destructive" size="sm" className="rounded-none" onClick={() => setDeleteTarget(account)}>
                        <Trash2 className="size-3.5" />
                        {t('adminSettings.userAccounts.delete')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500 dark:border-zinc-800/70 dark:text-zinc-400">
            <span>{t('adminSettings.userAccounts.pagination', { page: meta.page, total: meta.totalPages, count: meta.total })}</span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-none" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>{t('adminSettings.userAccounts.previous')}</Button>
              <Button type="button" variant="outline" size="sm" className="rounded-none" disabled={page >= meta.totalPages} onClick={() => setPage((prev) => prev + 1)}>{t('adminSettings.userAccounts.next')}</Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Edit dialog */}
      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => { if (!open && !updateAccount.isPending) setEditTarget(null); }}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>{t('adminSettings.userAccounts.editDialog.title')}</DialogTitle>
            <DialogDescription>{t('adminSettings.userAccounts.editDialog.description', { name: editTarget?.name ?? '' })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('adminSettings.userAccounts.name')}</Label>
              <Input id="edit-name" value={editForm.name ?? ''} onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">{t('adminSettings.userAccounts.email')}</Label>
              <Input id="edit-email" type="email" value={editForm.email ?? ''} onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))} />
            </div>
            {editTarget?.role === 'PROCTOR' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-department">{t('adminSettings.userAccounts.department')}</Label>
                  <Input id="edit-department" value={editForm.department ?? ''} onChange={(event) => setEditForm((prev) => ({ ...prev, department: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-max-exams">{t('adminSettings.userAccounts.maxExamsPerDay')}</Label>
                  <Input id="edit-max-exams" type="number" min={1} max={20} value={editForm.maxExamsPerDay ?? 2} onChange={(event) => setEditForm((prev) => ({ ...prev, maxExamsPerDay: Number(event.target.value) }))} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-none" disabled={updateAccount.isPending} onClick={() => setEditTarget(null)}>{t('actions.cancel')}</Button>
            <Button type="button" className="rounded-none" disabled={updateAccount.isPending} onClick={submitEdit}>
              {updateAccount.isPending && <Loader2 className="size-4 animate-spin" />}
              {t('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deleteAccount.isPending) setDeleteTarget(null); }}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>{t('adminSettings.userAccounts.deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('adminSettings.userAccounts.deleteDialog.description', { 
                name: deleteTarget?.name ?? '', 
                role: deleteTarget?.role === 'STUDENT' 
                  ? t('adminSettings.userAccounts.roles.student') 
                  : deleteTarget?.role === 'PROCTOR' 
                    ? t('adminSettings.userAccounts.roles.proctor') 
                    : t('adminSettings.userAccounts.roles.admin') 
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 rounded-none border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-300">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>{t('adminSettings.userAccounts.deleteDialog.warning')}</span>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-none" disabled={deleteAccount.isPending} onClick={() => setDeleteTarget(null)}>{t('actions.cancel')}</Button>
            <Button type="button" variant="destructive" className="rounded-none" disabled={deleteAccount.isPending} onClick={confirmDelete}>
              {deleteAccount.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {t('adminSettings.userAccounts.deleteDialog.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
