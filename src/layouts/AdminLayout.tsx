import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Building,
  Building2,
  Calendar,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  GraduationCap,
  LayoutDashboard,
  Layers,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User } from '@/api/auth.api';
import { cn } from '@/lib/utils';
import { useLogout } from '@/hooks/auth/useLogout';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { useDeleteAccount } from '@/hooks/auth/useDeleteAccount';
import { useSemesters } from '@/hooks/semesters/useSemesters';
import { DeleteConfirmModal } from '@/components/shared/DeleteConfirmModal';
import {
  CommandSearch,
  CommandSearchTrigger,
  CompactSearchButton,
  useCommandSearchShortcut,
} from '@/components/admin/CommandSearch';

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
};

const overviewItems: NavItem[] = [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }];

const academicItems: NavItem[] = [
  { label: 'Schedules', to: '/scheduling', icon: CalendarClock },
  { label: 'Programs / Departments', to: '/departments', icon: GraduationCap },
  { label: 'Semesters', to: '/semesters', icon: Calendar },
  { label: 'Course Offerings', to: '/course-offerings', icon: Layers },
  { label: 'Enrollments', to: '/enrollments', icon: ClipboardList },
];

const managementItems: NavItem[] = [
  { label: 'Students', to: '/students', icon: Users },
  { label: 'Proctors', to: '/proctors', icon: UserCog },
  { label: 'Courses', to: '/courses', icon: BookOpen },
  { label: 'Rooms', to: '/rooms', icon: Building2 },
  { label: 'Centers', to: '/centers', icon: Building },
  { label: 'Time Slots', to: '/timeslots', icon: Clock },
];

const configurationItems: NavItem[] = [{ label: 'Settings', to: '/settings', icon: Settings }];

const sidebarSections: NavSection[] = [
  { title: 'Overview', icon: LayoutDashboard, items: overviewItems },
  { title: 'Academic', icon: GraduationCap, items: academicItems },
  { title: 'Management', icon: Users, items: managementItems },
  { title: 'Configuration', icon: Settings, items: configurationItems },
];

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

const routeMap: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Monitor scheduling operations and platform health in one command center.' },
  '/schedule': { title: 'Schedules', subtitle: 'Generate and review exam schedule plans with operational clarity.' },
  '/scheduling': { title: 'Schedules', subtitle: 'Generate and review exam schedule plans with operational clarity.' },
  '/departments': { title: 'Programs / Departments', subtitle: 'Manage relational program data, department ownership, and course coverage in one workspace.' },
  '/semesters': { title: 'Semesters', subtitle: 'Control active terms, timelines, and planning windows precisely.' },
  '/course-offerings': { title: 'Course Offerings', subtitle: 'Track semester offerings, sections, and readiness across the catalog.' },
  '/enrollments': { title: 'Enrollments', subtitle: 'Manage student registrations and import workflows with confidence.' },
  '/students': { title: 'Students', subtitle: 'Oversee student records, activity, and academic readiness.' },
  '/proctors': { title: 'Proctors', subtitle: 'Coordinate invigilation staff and monitor assignment coverage.' },
  '/courses': { title: 'Courses', subtitle: 'Maintain the course catalog that powers exam generation and enrollment.' },
  '/rooms': { title: 'Rooms', subtitle: 'Review room capacity, readiness, and spatial availability.' },
  '/centers': { title: 'Centers', subtitle: 'Configure exam centers and manage distribution across locations.' },
  '/timeslots': { title: 'Time Slots', subtitle: 'Define scheduling windows and balance availability across sessions.' },
  '/settings': { title: 'Settings', subtitle: 'Tune system defaults, preferences, and administrative controls.' },
};

const getInitials = (name?: string) => {
  if (!name) return 'AU';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'AU';
};

const formatRole = (role?: string) => {
  if (!role) return 'Administrator';
  return role
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const getTokenPayload = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as { name?: string; role?: string; email?: string };
  } catch {
    return null;
  }
};

const SectionGroup: React.FC<{
  section: NavSection;
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

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`${section.title} navigation`}
            className={cn(
            'mx-auto flex size-12 items-center justify-center rounded-2xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300',
              hasActiveChild
                ? 'border-zinc-950 bg-zinc-950 text-white shadow-lg shadow-zinc-900/15'
                : 'border-zinc-200/70 bg-white/75 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950'
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
        <DropdownMenuContent side="right" align="start" sideOffset={14} className="w-64 rounded-2xl p-2">
          <DropdownMenuLabel>{section.title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {section.items.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <DropdownMenuItem key={item.to} asChild className={cn(isActive && 'bg-zinc-950 text-white focus:bg-zinc-950 focus:text-white')}>
                <NavLink
                  to={item.to}
                  onClick={onItemSelect}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive 
                      ? 'bg-zinc-950 text-white hover:bg-zinc-900 hover:text-white focus:bg-zinc-900 focus:text-white' 
                      : 'text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100'
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
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
          className="group flex w-full items-center justify-between rounded-md bg-zinc-100 px-2.5 py-1.5 mb-1 hover:bg-zinc-200/70 transition-colors duration-150"
          aria-label={`${section.title} navigation group`}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-zinc-700 transition-colors duration-150">
            {section.title}
          </span>
          <ChevronDown
            className={cn('size-3 text-zinc-400 transition-transform duration-200', isOpen ? 'rotate-180' : '')}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1">
        <div className="space-y-0.5 pb-3">
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onItemSelect}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute inset-y-2 left-1.5 w-0.5 rounded-full bg-white/60" />}
                  <item.icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const logoutMutation = useLogout();
  const deleteAccountMutation = useDeleteAccount();
  const { data } = useCurrentUser();
  const currentUser = data as User | undefined;

  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true');
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(sidebarSections.map((section) => [section.title, true]))
  );

  // Command palette state + global Ctrl/Cmd+K shortcut
  const [isCommandOpen, setIsCommandOpen] = React.useState(false);
  const toggleCommand = React.useCallback(() => setIsCommandOpen((prev) => !prev), []);
  useCommandSearchShortcut(toggleCommand);

  // Theme toggle (light / dark) — persists across sessions
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('admin-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

  // Active semester for navbar badge
  const { data: allSemesters } = useSemesters('');
  const activeSemester = React.useMemo(
    () =>
      allSemesters?.find((s) => s.isActive) ??
      allSemesters?.find((s) => s.isCurrent) ??
      allSemesters?.[0],
    [allSemesters]
  );

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebarCollapse = () => setIsCollapsed((prev) => !prev);

  React.useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const currentPage = routeMap[location.pathname] ?? {
    title: 'Admin Workspace',
    subtitle: 'Control exam scheduling from a single premium operations workspace.',
  };

  const tokenPayload = getTokenPayload();

  const userName = currentUser?.name ?? tokenPayload?.name ?? 'Admin User';
  const userRole = formatRole(currentUser?.role ?? tokenPayload?.role);
  const userInitials = getInitials(currentUser?.name ?? tokenPayload?.name);

  const toggleSection = (title: string, open: boolean) => {
    setOpenSections((prev) => ({ ...prev, [title]: open }));
  };

  const sidebarContent = (
    <>
      <div
        className={cn(
          'mb-3 flex shrink-0 items-center border-b border-zinc-100 pb-4 transition-all duration-300',
          isCollapsed ? 'justify-center px-0' : 'gap-3 px-2'
        )}
      >
        <div className={cn(
          'relative',
          isCollapsed ? 'mx-auto size-11 pointer-events-none' : 'shrink-0'
        )}>
          <div className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-[15px] border border-zinc-200/70 bg-zinc-950 shadow-sm transition-opacity duration-200',
            isCollapsed ? 'group-hover/sidebar:opacity-0' : ''
          )}>
            <Sparkles className="size-4.5 text-zinc-50" />
          </div>
          {isCollapsed && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Expand sidebar"
              aria-expanded={false}
              onClick={(e) => { e.stopPropagation(); toggleSidebarCollapse(); }}
              className="pointer-events-auto absolute inset-0 size-11 shrink-0 rounded-[15px] border border-zinc-200/70 bg-white text-zinc-500 shadow-sm transition-all hover:bg-zinc-100 hover:text-zinc-950 z-10 opacity-0 group-hover/sidebar:opacity-100 duration-200"
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
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Smart Exam Scheduler</p>
          <h2 className="truncate text-sm font-bold leading-none mt-0.5 text-zinc-950">Admin Dashboard</h2>
        </div>
        {!isCollapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Collapse sidebar"
                aria-expanded={true}
                onClick={toggleSidebarCollapse}
                className="ml-auto size-10 shrink-0 rounded-[14px] border border-zinc-200/70 bg-white text-zinc-500 shadow-sm transition-all hover:bg-zinc-100 hover:text-zinc-950 z-10"
              >
                <PanelLeftClose className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-medium">
              Collapse sidebar
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto pb-3 transition-[padding]", isCollapsed ? "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-0" : "pr-0.5 [scrollbar-gutter:stable]")} onClick={(e) => { e.stopPropagation(); if (isCollapsed && !(e.target as Element).closest('button, a, [role]')) toggleSidebarCollapse(); }}>
        <div className={cn('transition-all duration-300', isCollapsed ? 'space-y-2.5 pt-1' : 'space-y-1.5')}>
          {sidebarSections.map((section) => (
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

  const mobileSidebarAccountMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open account menu"
          className="group mt-4 flex w-full shrink-0 items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/85 px-3 py-3 shadow-sm shadow-zinc-200/40 transition-all duration-300 hover:border-zinc-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
        >
          <div className="flex size-9 shrink-0 transition-all duration-300 items-center justify-center rounded-full bg-zinc-950 text-xs font-bold text-white shadow-sm shadow-zinc-900/15">
            {userInitials}
          </div>
          <div className="w-full min-w-0 overflow-hidden whitespace-nowrap text-left">
            <p className="truncate text-sm font-bold text-zinc-950">{userName}</p>
            <p className="mt-0.5 truncate text-xs font-medium text-zinc-500">{userRole}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={14} className="w-64 rounded-2xl p-2">
        <DropdownMenuLabel>
          <div className="space-y-1 normal-case tracking-normal">
            <p className="text-sm font-semibold tracking-tight text-zinc-950">{userName}</p>
            <p className="text-xs font-medium text-zinc-500">{userRole}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer" onClick={closeSidebar}>
            <UserRound className="size-4" />
            <span>Manage Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
          <Trash2 className="size-4" />
          <span>Delete Account</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setIsLogoutModalOpen(true)}>
          <LogOut className="size-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const mobileSidebarContent = (
    <>
      <div className="mb-3 flex shrink-0 items-center gap-3 border-b border-zinc-100 pb-4 px-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-950 shadow-sm">
          <Sparkles className="size-4 text-zinc-50" />
        </div>
        <div className="w-full min-w-0 overflow-hidden whitespace-nowrap">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Smart Exam Scheduler</p>
          <h2 className="truncate text-sm font-bold leading-none mt-0.5 text-zinc-950">Admin Dashboard</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close sidebar"
          onClick={closeSidebar}
          className="ml-auto size-8 shrink-0 rounded-xl border border-zinc-200/70 bg-white text-zinc-500 shadow-sm transition-all hover:bg-zinc-100 hover:text-zinc-950"
        >
          <X className="size-4.5" />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-3 pr-0.5 [scrollbar-gutter:stable]">
        <div className="space-y-1.5">
          {sidebarSections.map((section) => (
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
      {mobileSidebarAccountMenu}
    </>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-zinc-50/60 text-zinc-950 selection:bg-zinc-200">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-zinc-200/30 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-sky-100/40 blur-3xl" />
      </div>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-zinc-200/70 bg-white/70 px-4 py-4 backdrop-blur-xl transition-[width] duration-300 ease-out md:flex group/sidebar',
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
          'fixed inset-0 z-40 bg-zinc-950/35 backdrop-blur-sm md:hidden transition-opacity duration-500 ease-in-out',
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeSidebar}
        tabIndex={isSidebarOpen ? 0 : -1}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-zinc-200/70 bg-white/88 px-4 py-4 backdrop-blur-xl transition-[transform,opacity] duration-500 ease-in-out md:hidden w-[86vw] max-w-[320px]',
          isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        )}
      >
        {mobileSidebarContent}
      </aside>

      <div className={cn('flex min-h-screen flex-col transition-[padding-left] duration-300 ease-out', isCollapsed ? 'md:pl-24' : 'md:pl-80')}>
        <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/72 backdrop-blur-xl supports-backdrop-filter:bg-white/60 dark:border-zinc-800/70 dark:bg-zinc-950/70">
          <div className="flex h-19 items-center gap-3 px-4 sm:px-6 lg:gap-4 lg:px-8">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Toggle menu"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="shrink-0 rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 md:hidden"
            >
              <Menu className="size-5" />
            </Button>

            {/* CENTER: command search */}
            <div className="hidden flex-1 justify-center px-2 md:flex md:pl-0">
              <div className="w-full max-w-xl">
                <CommandSearchTrigger onOpen={() => setIsCommandOpen(true)} />
              </div>
            </div>

            {/* RIGHT: actions */}
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <CompactSearchButton
                onOpen={() => setIsCommandOpen(true)}
                className="md:hidden"
              />

              {activeSemester && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/semesters"
                      className="hidden h-10 items-center gap-2 rounded-full border border-zinc-200/70 bg-white/80 px-3 text-xs font-semibold text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-white sm:inline-flex dark:border-zinc-700/70 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    >
                      <span className="flex size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" aria-hidden />
                      <Calendar className="size-3.5 text-zinc-500 dark:text-zinc-400" />
                      <span className="max-w-40 truncate">{activeSemester.name}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="font-medium">
                    Active semester
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                    aria-pressed={theme === 'dark'}
                    onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                    className="rounded-full border border-zinc-200/70 bg-white/80 text-zinc-600 shadow-sm hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700/70 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="font-medium">
                  {theme === 'dark' ? 'Light theme' : 'Dark theme'}
                </TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/80 px-2.5 py-2 shadow-sm shadow-zinc-200/40 transition-all hover:border-zinc-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:border-zinc-700/70 dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
                  >
                    <div className="hidden min-w-0 text-right sm:block">
                      <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">{userName}</p>
                      <p className="mt-0.5 truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">{userRole}</p>
                    </div>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-zinc-50 shadow-sm shadow-zinc-900/15 dark:bg-zinc-50 dark:text-zinc-950">
                      {userInitials}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={12} className="w-64 rounded-2xl p-2">
                  <DropdownMenuLabel>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold tracking-tight text-zinc-950">{userName}</p>
                      <p className="text-xs font-medium text-zinc-500">{userRole}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <UserRound className="size-4" />
                      <span>Manage Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
                    <Trash2 className="size-4" />
                    <span>Delete Account</span>
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

        <section className="px-5 pt-4 pb-0 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400"
          >
            <span>Admin</span>
            <ChevronRight className="size-3" />
            <span className="text-zinc-500">{currentPage.title}</span>
          </nav>
        </section>

        <main className="flex-1">
          <div className="animate-in fade-in duration-300">
            <Outlet />
          </div>
        </main>
      </div>

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
            },
          });
        }}
      />

      <CommandSearch open={isCommandOpen} onOpenChange={setIsCommandOpen} />
    </div>
    </TooltipProvider>
  );
};
