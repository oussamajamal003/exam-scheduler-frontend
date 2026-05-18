import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  X,
  Search,
  Sparkles,
  Trash2,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  CommandSearch,
  CommandSearchTrigger,
  CompactSearchButton,
  useCommandSearchShortcut,
  type QuickAction,
} from '@/components/admin/CommandSearch';
import type { User } from '@/api/auth.api';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { useDeleteAccount } from '@/hooks/auth/useDeleteAccount';
import { useLogout } from '@/hooks/auth/useLogout';
import { useRoleNotifications } from '@/hooks/roleNotifications/useRoleNotifications';
import { cn } from '@/lib/utils';
import { DeleteConfirmModal } from '@/components/shared/DeleteConfirmModal';

export type RoleNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  subtitle?: string;
};

export type RoleNavSection = {
  title: string;
  icon: LucideIcon;
  items: RoleNavItem[];
  /**
   * When true, items render as standalone NavLinks (no section title chip in expanded mode,
   * no dropdown wrapper in collapsed mode). Each item gets its own icon + tooltip.
   */
  flat?: boolean;
};

type RoleDashboardLayoutProps = {
  roleName: string;
  portalTitle: string;
  breadcrumbRoot: string;
  storageKey: string;
  navSections: RoleNavSection[];
  fallbackName: string;
  fallbackInitials: string;
  searchPlaceholder: string;
};

const THEME_STORAGE_KEY = 'admin-theme';

const getInitials = (name?: string, fallback = 'U') => {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || fallback;
};

const formatRole = (role?: string, fallback = 'User') => {
  if (!role) return fallback;
  return role
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const getTokenPayload = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as { name?: string; role?: string; email?: string };
  } catch {
    return null;
  }
};

const SectionGroup: React.FC<{
  section: RoleNavSection;
  isOpen: boolean;
  isCollapsed: boolean;
  onOpenChange: (open: boolean) => void;
  onItemSelect: () => void;
}> = ({ section, isOpen, isCollapsed, onOpenChange, onItemSelect }) => {
  const location = useLocation();
  const hasActiveChild = section.items.some((item) => location.pathname === item.to);
  const SectionIcon = section.icon;

  React.useEffect(() => {
    if (hasActiveChild && !isOpen) {
      onOpenChange(true);
    }
  }, [hasActiveChild, isOpen, onOpenChange]);

  if (section.flat) {
    if (isCollapsed) {
      return (
        <>
          {section.items.map((item) => {
            const ItemIcon = item.icon;
            const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onItemSelect}
                aria-label={item.label}
                className={cn(
                  'mx-auto flex size-12 items-center justify-center rounded-2xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-600',
                  isActive
                    ? 'border-zinc-950 bg-zinc-950 text-white shadow-lg shadow-zinc-900/15 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:shadow-white/5'
                    : 'border-zinc-200/70 bg-white/75 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800/80 dark:bg-zinc-900/55 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                )}
              >
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <span className="flex items-center justify-center">
                      <ItemIcon className="size-5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={20} className="z-50 font-semibold">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </NavLink>
            );
          })}
        </>
      );
    }

    return (
      <div className="space-y-0.5 pb-3">
        {section.items.map((item) => {
          const ItemIcon = item.icon;
          const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onItemSelect}
              className={cn(
                'relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-zinc-950 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              {isActive && <span className="absolute inset-y-2 left-1.5 w-0.5 rounded-full bg-white/60 dark:bg-zinc-900/70" />}
              <ItemIcon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`${section.title} navigation`}
            className={cn(
              'mx-auto flex size-12 items-center justify-center rounded-2xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-600',
              hasActiveChild
                ? 'border-zinc-950 bg-zinc-950 text-white shadow-lg shadow-zinc-900/15 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:shadow-white/5'
                : 'border-zinc-200/70 bg-white/75 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800/80 dark:bg-zinc-900/55 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
            )}
          >
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <span className="flex items-center justify-center">
                  <SectionIcon className="size-5" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={20} className="font-semibold">
                {section.title}
              </TooltipContent>
            </Tooltip>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={14} className="w-64 rounded-2xl border-zinc-200/80 bg-white/95 p-2 shadow-xl shadow-zinc-950/10 dark:border-zinc-800/80 dark:bg-zinc-950/95 dark:shadow-black/40">
          <DropdownMenuLabel>{section.title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {section.items.map((item) => {
            const isActive = location.pathname === item.to;
            const ItemIcon = item.icon;
            return (
              <DropdownMenuItem
                key={item.to}
                asChild
                className={cn(isActive && 'bg-zinc-950 text-white focus:bg-zinc-950 focus:text-white dark:bg-zinc-100 dark:text-zinc-950 dark:focus:bg-zinc-100 dark:focus:text-zinc-950')}
              >
                <NavLink
                  to={item.to}
                  onClick={onItemSelect}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-zinc-950 text-white hover:bg-zinc-900 hover:text-white focus:bg-zinc-900 focus:text-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:hover:text-zinc-950 dark:focus:bg-zinc-200'
                      : 'text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800'
                  )}
                >
                  <ItemIcon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="group mb-1 flex w-full items-center justify-between rounded-md bg-zinc-100 px-2.5 py-1.5 transition-colors duration-150 hover:bg-zinc-200/70 dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
          aria-label={`${section.title} navigation group`}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 transition-colors duration-150 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-300">
            {section.title}
          </span>
          <ChevronDown
            className={cn('size-3 text-zinc-400 transition-transform duration-200 dark:text-zinc-500', isOpen ? 'rotate-180' : '')}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1">
        <div className="space-y-0.5 pb-3">
          {section.items.map((item) => {
            const ItemIcon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onItemSelect}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-zinc-950 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute inset-y-2 left-1.5 w-0.5 rounded-full bg-white/60 dark:bg-zinc-900/70" />}
                    <ItemIcon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const RoleDashboardLayout: React.FC<RoleDashboardLayoutProps> = ({
  roleName,
  portalTitle,
  breadcrumbRoot,
  storageKey,
  navSections,
  fallbackName,
  fallbackInitials,
  searchPlaceholder,
}) => {
  const location = useLocation();
  const logoutMutation = useLogout();
  const deleteAccountMutation = useDeleteAccount();
  const { data } = useCurrentUser();
  const currentUser = data as User | undefined;
  const isStudentPortal = roleName.toLowerCase() === 'student';
  const portal = isStudentPortal ? 'student' : 'proctor';
  const notificationHref = `/${portal}/dashboard#notifications`;
  const notificationQuery = useRoleNotifications({ portal, limit: 1 });
  const unreadNotifications = notificationQuery.data?.unreadCount ?? 0;

  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(() => localStorage.getItem(storageKey) === 'true');
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(navSections.map((section) => [section.title, true]))
  );
  const [isCommandOpen, setIsCommandOpen] = React.useState(false);

  const toggleCommand = React.useCallback(() => setIsCommandOpen((prev) => !prev), []);
  useCommandSearchShortcut(toggleCommand);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebarCollapse = () => setIsCollapsed((prev) => !prev);

  React.useEffect(() => {
    localStorage.setItem(storageKey, String(isCollapsed));
  }, [isCollapsed, storageKey]);

  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const tokenPayload = getTokenPayload();
  const userName = currentUser?.name ?? tokenPayload?.name ?? fallbackName;
  const userEmail = currentUser?.email ?? tokenPayload?.email ?? `${roleName.toLowerCase()}@example.com`;
  const userRole = formatRole(currentUser?.role ?? tokenPayload?.role, roleName);
  const userInitials = getInitials(currentUser?.name ?? tokenPayload?.name, fallbackInitials);

  const allItems = navSections.flatMap((section) => section.items);
  const currentPage =
    allItems.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)) ??
    allItems[0];

  const toggleSection = (title: string, open: boolean) => {
    setOpenSections((prev) => ({ ...prev, [title]: open }));
  };

  const commandQuickActions = React.useMemo<QuickAction[]>(() => {
    if (isStudentPortal) {
      return [
        {
          id: 'student-dashboard',
          label: 'Open Dashboard',
          description: 'Go to the student overview',
          icon: Sparkles,
          href: '/student/dashboard',
          keywords: ['dashboard', 'overview', 'home'],
        },
        {
          id: 'student-schedule',
          label: 'Open Exam Schedule',
          description: 'Review upcoming exam assignments',
          icon: Search,
          href: '/student/schedule',
          keywords: ['exam', 'schedule', 'assignments'],
        },
        {
          id: 'student-courses',
          label: 'Open Courses',
          description: 'View registered courses and exam courses',
          icon: Search,
          href: '/student/courses',
          keywords: ['courses', 'registered', 'subjects'],
        },
        {
          id: 'student-notifications',
          label: 'Open Notifications',
          description: 'Jump to recent updates on your dashboard overview',
          icon: Bell,
          href: notificationHref,
          keywords: ['notifications', 'alerts', 'updates'],
        },
      ];
    }

    return [
      {
        id: 'proctor-dashboard',
        label: 'Open Dashboard',
        description: 'Go to the proctor overview',
        icon: Sparkles,
        href: '/proctor/dashboard',
        keywords: ['dashboard', 'overview', 'home'],
      },
      {
        id: 'proctor-schedule',
        label: 'Open Exam Schedule',
        description: 'Review assigned duties and published schedule',
        icon: Search,
        href: '/proctor/schedule',
        keywords: ['schedule', 'duties', 'assignments'],
      },
      {
        id: 'proctor-students',
        label: 'Open Assigned Students',
        description: 'Inspect exam rosters for assigned duties',
        icon: Search,
        href: '/proctor/students',
        keywords: ['students', 'roster', 'assigned'],
      },
      {
        id: 'proctor-settings',
        label: 'Open Settings',
        description: 'Manage security and notification preferences',
        icon: Search,
        href: '/proctor/settings',
        keywords: ['settings', 'profile', 'password'],
      },
    ];
  }, [isStudentPortal]);

  const sidebarContent = (
    <>
      <div
        className={cn(
          'mb-3 flex shrink-0 items-center border-b border-zinc-100 pb-4 transition-all duration-300 dark:border-zinc-800/80',
          isCollapsed ? 'justify-center px-0' : 'gap-3 px-2'
        )}
      >
        <div className={cn(
          'relative',
          isCollapsed ? 'mx-auto size-11 pointer-events-none' : 'shrink-0'
        )}>
          <div className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-[15px] border border-zinc-200/70 bg-zinc-950 shadow-sm transition-opacity duration-200 dark:border-zinc-700/80 dark:bg-zinc-100',
            isCollapsed ? 'group-hover/sidebar:opacity-0' : ''
          )}>
            <Sparkles className="size-4.5 text-zinc-50 dark:text-zinc-950" />
          </div>
          {isCollapsed && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Expand sidebar"
              aria-expanded={false}
              onClick={(e) => { e.stopPropagation(); toggleSidebarCollapse(); }}
              className="pointer-events-auto absolute inset-0 z-10 size-11 shrink-0 rounded-[15px] border border-zinc-200/70 bg-white text-zinc-500 opacity-0 shadow-sm transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-950 group-hover/sidebar:opacity-100 dark:border-zinc-700/80 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <PanelLeftOpen className="size-4.5" />
            </Button>
          )}
        </div>
        <div
          className={cn(
            'min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300',
            isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'
          )}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Smart Exam Scheduler</p>
          <h2 className="mt-0.5 truncate text-sm font-bold leading-none text-zinc-950 dark:text-zinc-50">{portalTitle}</h2>
        </div>
        {!isCollapsed && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Collapse sidebar"
            aria-expanded={true}
            onClick={toggleSidebarCollapse}
            className="z-10 ml-auto size-10 shrink-0 rounded-[14px] border border-zinc-200/70 bg-white text-zinc-500 shadow-sm transition-all hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700/80 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            <PanelLeftClose className="size-5" />
          </Button>
        )}
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto pb-3 transition-[padding]",
          isCollapsed ? "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-0" : "pr-0.5 [scrollbar-gutter:stable]"
        )}
        aria-label={`${roleName} navigation`}
        onClick={(e) => { e.stopPropagation(); if (isCollapsed && !(e.target as Element).closest('button, a, [role]')) toggleSidebarCollapse(); }}
      >
        <div className={cn('transition-all duration-300', isCollapsed ? 'space-y-2.5 pt-1' : 'space-y-1.5')}>
          {navSections.map((section) => (
            <SectionGroup
              key={section.title}
              section={section}
              isOpen={openSections[section.title] ?? true}
              isCollapsed={isCollapsed}
              onOpenChange={(open) => toggleSection(section.title, open)}
              onItemSelect={closeSidebar}
            />
          ))}
        </div>
      </div>

    </>
  );

  const mobileSidebarContent = (
    <>
      <div className="mb-3 flex shrink-0 items-center gap-3 border-b border-zinc-100 px-2 pb-4 dark:border-zinc-800/80">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-950 shadow-sm dark:bg-zinc-100">
          <Sparkles className="size-4 text-zinc-50 dark:text-zinc-950" />
        </div>
        <div className="w-full min-w-0 overflow-hidden whitespace-nowrap">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Smart Exam Scheduler</p>
          <h2 className="mt-0.5 truncate text-sm font-bold leading-none text-zinc-950 dark:text-zinc-50">{portalTitle}</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close sidebar"
          onClick={closeSidebar}
          className="ml-auto size-8 shrink-0 rounded-xl border border-zinc-200/70 bg-white text-zinc-500 shadow-sm transition-all hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700/80 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          <X className="size-4.5" />
        </Button>
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-3 pr-0.5 [scrollbar-gutter:stable]"
        aria-label={`${roleName} navigation`}
      >
        <div className="space-y-1.5">
          {navSections.map((section) => (
            <SectionGroup
              key={section.title}
              section={section}
              isOpen={openSections[section.title] ?? true}
              isCollapsed={false}
              onOpenChange={(open) => toggleSection(section.title, open)}
              onItemSelect={closeSidebar}
            />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-zinc-50/60 text-zinc-950 selection:bg-zinc-200 dark:bg-zinc-950 dark:text-zinc-50 dark:selection:bg-zinc-800">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-zinc-200/30 blur-3xl dark:bg-zinc-800/20" />
          <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-sky-100/40 blur-3xl dark:bg-zinc-700/10" />
        </div>

        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-zinc-200/70 bg-white/70 px-4 py-4 backdrop-blur-xl transition-[width] duration-300 ease-out md:flex group/sidebar dark:border-zinc-800/80 dark:bg-zinc-950/78 dark:shadow-2xl dark:shadow-black/30',
            isCollapsed ? 'w-24 cursor-default [&_button]:cursor-pointer [&_a]:cursor-pointer' : 'w-80'
          )}
          onClick={isCollapsed ? toggleSidebarCollapse : undefined}
        >
          {sidebarContent}
        </aside>

        <button
          type="button"
          aria-label="Close sidebar overlay"
          className={cn(
            'fixed inset-0 z-40 bg-zinc-950/35 backdrop-blur-sm md:hidden transition-opacity duration-500 ease-in-out dark:bg-black/60',
            isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
          onClick={closeSidebar}
          tabIndex={isSidebarOpen ? 0 : -1}
        />

        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-zinc-200/70 bg-white/88 px-4 py-4 backdrop-blur-xl transition-[transform,opacity] duration-500 ease-in-out md:hidden w-[86vw] max-w-[320px] dark:border-zinc-800/80 dark:bg-zinc-950/92',
            isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
          )}
        >
          {mobileSidebarContent}
        </aside>

        <div
          className={cn(
            'flex min-h-screen flex-col transition-[padding-left] duration-300 ease-out',
            isCollapsed ? 'md:pl-24' : 'md:pl-80'
          )}
        >
          <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/72 backdrop-blur-xl supports-backdrop-filter:bg-white/60 dark:border-zinc-800/70 dark:bg-zinc-950/70">
            <div className="flex h-19 items-center gap-4 px-4 sm:px-6 lg:px-8">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Toggle menu"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className="shrink-0 rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 md:hidden dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                <Menu className="size-5" />
              </Button>

              <div className="hidden max-w-xl flex-1 md:block">
                <CommandSearchTrigger onOpen={() => setIsCommandOpen(true)} placeholder={searchPlaceholder} />
              </div>

              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <CompactSearchButton
                  onOpen={() => setIsCommandOpen(true)}
                  className="md:hidden"
                />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                      aria-pressed={theme === 'dark'}
                      onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
                      className="rounded-full border border-zinc-200/70 bg-white/80 text-zinc-600 shadow-sm hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700/70 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="font-medium">
                    {theme === 'dark' ? 'Light theme' : 'Dark theme'}
                  </TooltipContent>
                </Tooltip>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Notifications"
                  asChild={isStudentPortal}
                  className="relative rounded-full border border-zinc-200/70 bg-white/80 text-zinc-500 shadow-sm hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700/70 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <NavLink to={notificationHref}>
                    <Bell className="size-4.5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 px-1 text-[10px] font-bold leading-4 text-white dark:border-zinc-900">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </NavLink>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Open account menu"
                      className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/80 px-2.5 py-2 shadow-sm shadow-zinc-200/40 transition-all hover:border-zinc-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:border-zinc-700/70 dark:bg-zinc-900/60 dark:shadow-black/30 dark:hover:bg-zinc-900 dark:focus-visible:ring-zinc-600"
                    >
                      <div className="hidden min-w-0 text-right sm:block">
                        <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">{userName}</p>
                        <p className="mt-0.5 truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">{userRole}</p>
                      </div>
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-zinc-50 shadow-sm shadow-zinc-900/15 dark:bg-zinc-50 dark:text-zinc-950 dark:shadow-white/5">
                        {userInitials}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={12} className="w-64 rounded-2xl border-zinc-200/80 bg-white/95 p-2 shadow-xl shadow-zinc-950/10 dark:border-zinc-800/80 dark:bg-zinc-950/95 dark:shadow-black/40">
                    <DropdownMenuLabel>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{userName}</p>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{userRole}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)}>
                      <UserRound className="size-4" />
                      <span>Manage Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsLogoutModalOpen(true)}>
                      <LogOut className="size-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <section className="px-5 pb-0 pt-4 sm:px-6 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500"
            >
              <span>{breadcrumbRoot}</span>
              <ChevronRight className="size-3" />
              <span className="text-zinc-500 dark:text-zinc-400">{currentPage.label}</span>
            </nav>
          </section>

          <main className="flex-1">
            <div className="animate-in fade-in duration-300">
              <Outlet />
            </div>
          </main>
        </div>

        <DeleteConfirmModal
          open={isDeleteModalOpen}
          title="Delete Account"
          description="This permanently removes your account from the system. This action cannot be undone."
          confirmLabel="Delete Account"
          isLoading={deleteAccountMutation.isPending}
          errorMessage={deleteAccountMutation.isError ? 'Failed to delete account. Please try again.' : undefined}
          onCancel={() => {
            if (!deleteAccountMutation.isPending) {
              setIsDeleteModalOpen(false);
            }
          }}
          onConfirm={() => {
            deleteAccountMutation.mutate(undefined, {
              onSuccess: () => {
                setIsDeleteModalOpen(false);
                setIsProfileDialogOpen(false);
              },
            });
          }}
        />

        <CommandSearch
          open={isCommandOpen}
          onOpenChange={setIsCommandOpen}
          quickActions={commandQuickActions}
          placeholder={searchPlaceholder}
          initialTitle={isStudentPortal ? 'Search your student workspace' : 'Search your proctor workspace'}
          initialDescription={isStudentPortal
            ? 'Find registered courses, exam schedule details, rooms, centers and published schedules.'
            : 'Find assigned duties, students, rooms, centers and published schedules.'}
          emptyDescription={isStudentPortal
            ? 'Try a course code, room name, center name or published schedule.'
            : 'Try a course code, student name, room name or published schedule.'}
          footerLabel={isStudentPortal ? 'Student Command Search' : 'Proctor Command Search'}
          recentStorageKey={isStudentPortal ? 'student-command-search-recent' : 'proctor-command-search-recent'}
        />

        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="max-w-lg rounded-2xl border-zinc-200/80 bg-white/95 p-0 shadow-2xl shadow-zinc-950/20 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/95 dark:shadow-black/50">
            <DialogHeader className="border-b border-zinc-200/70 px-6 py-5 dark:border-zinc-800/80">
              <DialogTitle className="text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Manage Profile
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Review your account identity, access role, and session details for this workspace.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 px-6 py-5">
              <Card className="rounded-2xl border border-zinc-200/70 bg-zinc-50/70 py-0 shadow-none ring-0 dark:border-zinc-800/80 dark:bg-zinc-900/45">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-base font-bold text-white shadow-lg shadow-zinc-900/15 dark:bg-zinc-100 dark:text-zinc-950 dark:shadow-white/5">
                      {userInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-zinc-950 dark:text-zinc-50">{userName}</p>
                        <Badge className="border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                          {userRole}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">{userEmail}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-zinc-200/70 bg-white/85 py-0 shadow-none ring-0 dark:border-zinc-800/80 dark:bg-zinc-950/55">
                <CardContent className="grid gap-4 p-4">
                  <div className="grid gap-1.5 rounded-xl border border-zinc-200/70 bg-zinc-50/80 p-3 dark:border-zinc-800/80 dark:bg-zinc-900/60">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                      Name
                    </p>
                    <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{userName}</p>
                  </div>

                  <div className="grid gap-1.5 rounded-xl border border-zinc-200/70 bg-zinc-50/80 p-3 dark:border-zinc-800/80 dark:bg-zinc-900/60">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                      Email
                    </p>
                    <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{userEmail}</p>
                  </div>

                  <div className="grid gap-1.5 rounded-xl border border-zinc-200/70 bg-zinc-50/80 p-3 dark:border-zinc-800/80 dark:bg-zinc-900/60">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                      Role
                    </p>
                    <div>
                      <Badge className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
                        {userRole}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-rose-200/80 bg-rose-50/80 py-0 shadow-none ring-0 dark:border-rose-900/70 dark:bg-rose-950/25">
                <CardContent className="space-y-4 p-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">
                      <Trash2 className="size-3.5" />
                      Danger Zone
                    </div>
                    <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Delete Account</p>
                    <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                      Permanently remove this account from the system. This action cannot be undone.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="h-10 rounded-xl px-4 font-semibold"
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        <DeleteConfirmModal
          open={isLogoutModalOpen}
          title="Confirm Logout"
          description="Are you sure you want to securely logout from the system?"
          confirmLabel="Logout"
          isLoading={logoutMutation.isPending}
          errorMessage={logoutMutation.isError ? 'Failed to logout. Please try again.' : undefined}
          onCancel={() => {
            if (!logoutMutation.isPending) {
              setIsLogoutModalOpen(false);
            }
          }}
          onConfirm={() => {
            logoutMutation.mutate(undefined, {
              onSuccess: () => {
                setIsLogoutModalOpen(false);
              },
            });
          }}
        />
      </div>
    </TooltipProvider>
  );
};
