import React from 'react';
import { Bell, CheckCheck, Clock3, Megaphone, Sparkles, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUtcDate } from '@/lib/dateTime';
import type { RoleNotification } from '@/api/roleNotifications.api';

const getNotificationIcon = (type: string) => {
  if (type === 'SCHEDULE_UPDATED' || type === 'ROOM_TIME_CHANGE') return Sparkles;
  if (type === 'NEW_DUTY_ASSIGNED') return UserCheck;
  if (type === 'ANNOUNCEMENT') return Megaphone;
  return Bell;
};

const getNotificationLabel = (type: string) => {
  if (type === 'SCHEDULE_PUBLISHED') return 'Schedule published';
  if (type === 'SCHEDULE_UPDATED') return 'Schedule updated';
  if (type === 'ROOM_TIME_CHANGE') return 'Room / time change';
  if (type === 'NEW_DUTY_ASSIGNED') return 'New duty assigned';
  if (type === 'ANNOUNCEMENT') return 'Announcement';
  return type.replaceAll('_', ' ').toLowerCase();
};

type DashboardNotificationsPanelProps = {
  title?: string;
  notifications: RoleNotification[];
  unreadCount: number;
  isLoading?: boolean;
  isError?: boolean;
  emptyLabel: string;
  errorLabel: string;
  markReadPending?: boolean;
  markAllPending?: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
};

export const DashboardNotificationsPanel: React.FC<DashboardNotificationsPanelProps> = ({
  title = 'Notifications / Updates',
  notifications,
  unreadCount,
  isLoading = false,
  isError = false,
  emptyLabel,
  errorLabel,
  markReadPending = false,
  markAllPending = false,
  onMarkRead,
  onMarkAllRead,
}) => {
  return (
    <Card id="notifications" className="scroll-mt-28 rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
      <CardHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            <Bell className="size-4 text-zinc-400" />
            {title}
            <Badge variant="secondary">{unreadCount} unread</Badge>
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0 || markAllPending}
            className="rounded-sm"
          >
            <CheckCheck className="mr-2 size-4" />
            Mark all read
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {isLoading ? (
          [0, 1, 2].map((item) => <Skeleton key={item} className="h-24" />)
        ) : isError ? (
          <p className="py-8 text-center text-sm text-rose-600 dark:text-rose-300">{errorLabel}</p>
        ) : notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">{emptyLabel}</p>
        ) : (
          notifications.map((notification) => {
            const NotificationIcon = getNotificationIcon(notification.type);
            const unread = !notification.readAt;

            return (
              <div
                key={notification.id}
                className="flex flex-col gap-3 rounded-none border border-zinc-200/70 bg-zinc-50/70 p-3 dark:border-zinc-800/70 dark:bg-zinc-900/45 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-none bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
                    <NotificationIcon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{notification.title}</p>
                      {unread && <Badge variant="success">Unread</Badge>}
                      <Badge variant="secondary">{getNotificationLabel(notification.type)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{notification.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
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
                    onClick={() => onMarkRead(notification.id)}
                    disabled={markReadPending}
                    className="h-8 rounded-sm text-xs"
                  >
                    Mark read
                  </Button>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};