import React from 'react';
import { Bell, CheckCheck, Clock3, Megaphone, RefreshCw, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useMarkAllStudentNotificationsRead,
  useMarkStudentNotificationRead,
  useStudentNotifications,
} from '@/hooks/studentNotifications/useStudentNotifications';
import type { StudentNotification } from '@/api/studentNotifications.api';
import { formatUtcDate } from '@/lib/dateTime';

const getNotificationIcon = (type: string) => {
  if (type === 'SCHEDULE_UPDATED' || type === 'ROOM_TIME_CHANGE') return Sparkles;
  if (type === 'ANNOUNCEMENT') return Megaphone;
  return Bell;
};

const getNotificationLabel = (type: string) => {
  if (type === 'SCHEDULE_PUBLISHED') return 'Schedule published';
  if (type === 'SCHEDULE_UPDATED') return 'Schedule updated';
  if (type === 'ROOM_TIME_CHANGE') return 'Room / time change';
  if (type === 'ANNOUNCEMENT') return 'Announcement';
  return type.replaceAll('_', ' ').toLowerCase();
};

const NotificationItem = ({ notification }: { notification: StudentNotification }) => {
  const markRead = useMarkStudentNotificationRead();
  const Icon = getNotificationIcon(notification.type);
  const unread = !notification.readAt;

  return (
    <div className="flex flex-col gap-3 rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/45 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-none bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{notification.title}</p>
            {unread && <Badge variant="success">Unread</Badge>}
            <Badge variant="secondary">{getNotificationLabel(notification.type)}</Badge>
          </div>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{notification.message}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
            <Clock3 className="size-3.5" />
            <span>{formatUtcDate(notification.createdAt)}</span>
            {notification.schedule?.name && <span>{notification.schedule.name}</span>}
          </div>
        </div>
      </div>

      {unread && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => markRead.mutate(notification.id)}
          disabled={markRead.isPending}
          className="h-8 rounded-sm text-xs"
        >
          Mark read
        </Button>
      )}
    </div>
  );
};

export const StudentNotificationsPage: React.FC = () => {
  const notificationsQuery = useStudentNotifications({ limit: 100 });
  const markAllRead = useMarkAllStudentNotificationsRead();
  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  return (
    <div className="space-y-5 p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Notifications</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Schedule updates and messages</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Updates shown here are scoped to your registered courses and published exam schedules.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => markAllRead.mutate()}
          disabled={unreadCount === 0 || markAllRead.isPending}
          className="w-fit rounded-sm"
        >
          <CheckCheck className="mr-2 size-4" />
          Mark all read
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-none bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
              <Bell className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">All Notifications</p>
              <p className="mt-1 text-3xl font-bold text-zinc-950 dark:text-zinc-50">{notifications.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-none bg-emerald-600 text-white">
              <RefreshCw className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Unread</p>
              <p className="mt-1 text-3xl font-bold text-zinc-950 dark:text-zinc-50">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <CardHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800/70">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            <Bell className="size-4 text-zinc-400" />
            Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-5">
          {notificationsQuery.isLoading ? (
            [0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-24" />)
          ) : notificationsQuery.isError ? (
            <p className="py-10 text-center text-sm text-rose-600 dark:text-rose-300">Unable to load notifications.</p>
          ) : notifications.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">No notifications available yet.</p>
          ) : (
            notifications.map((notification) => <NotificationItem key={notification.id} notification={notification} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
};
