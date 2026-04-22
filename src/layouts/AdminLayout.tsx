import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
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
  Menu,
  Search,
  Settings,
  Sparkles,
  Trash2,
  UserCog,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { DeleteConfirmModal } from '@/components/shared/DeleteConfirmModal';

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const overviewItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Schedules', to: '/scheduling', icon: CalendarClock },
  { label: 'Conflicts', to: '/conflicts', icon: AlertTriangle },
  { label: 'AI Optimizer', to: '/ai', icon: Sparkles },
];

const academicItems: NavItem[] = [
  { label: 'Programs / Departments', to: '/departments', icon: GraduationCap },
  { label: 'Semesters', to: '/semesters', icon: Calendar },
  { label: 'Course Offerings', to: '/course-offerings', icon: Layers },
  { label: 'Enrollments', to: '/enrollments', icon: ClipboardList },
];

const managementItems: NavItem[] = [
  { label: 'Students', to: '/students', icon: Users },
  { label: 'Supervisors', to: '/supervisors', icon: UserCog },
  { label: 'Courses', to: '/courses', icon: BookOpen },
  { label: 'Rooms', to: '/rooms', icon: Building2 },
  { label: 'Centers', to: '/centers', icon: Building },
  { label: 'Time Slots', to: '/timeslots', icon: Clock },
];

const configurationItems: NavItem[] = [{ label: 'Settings', to: '/settings', icon: Settings }];

const sidebarSections: NavSection[] = [
  { title: 'Overview', items: overviewItems },
  { title: 'Academic', items: academicItems },
  { title: 'Management', items: managementItems },
  { title: 'Configuration', items: configurationItems },
];

const routeMap: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Monitor scheduling operations and platform health in one command center.' },
  '/schedule': { title: 'Schedules', subtitle: 'Generate and review exam schedule plans with operational clarity.' },
  '/scheduling': { title: 'Schedules', subtitle: 'Generate and review exam schedule plans with operational clarity.' },
  '/conflicts': { title: 'Conflicts', subtitle: 'Detect clashes, prioritize issues, and resolve conflicts faster.' },
  '/ai': { title: 'AI Optimizer', subtitle: 'Model better scheduling outcomes with AI-assisted optimization.' },
  '/departments': { title: 'Programs / Departments', subtitle: 'Manage relational program data, department ownership, and course coverage in one workspace.' },
  '/semesters': { title: 'Semesters', subtitle: 'Control active terms, timelines, and planning windows precisely.' },
  '/course-offerings': { title: 'Course Offerings', subtitle: 'Track semester offerings, sections, and readiness across the catalog.' },
  '/enrollments': { title: 'Enrollments', subtitle: 'Manage student registrations and import workflows with confidence.' },
  '/students': { title: 'Students', subtitle: 'Oversee student records, activity, and academic readiness.' },
  '/supervisors': { title: 'Supervisors', subtitle: 'Coordinate invigilation staff and monitor assignment coverage.' },
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
  onOpenChange: (open: boolean) => void;
  onItemSelect: () => void;
}> = ({ section, isOpen, onOpenChange, onItemSelect }) => {
  const location = useLocation();
  const hasActiveChild = section.items.some((item) => location.pathname === item.to);

  React.useEffect(() => {
    if (hasActiveChild && !isOpen) {
      onOpenChange(true);
    }
  }, [hasActiveChild, isOpen, onOpenChange]);

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange} className="rounded-2xl border border-zinc-200/80 bg-white/80 shadow-sm shadow-zinc-200/40 backdrop-blur-md">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left transition-all duration-200',
            hasActiveChild ? 'bg-zinc-100/80 shadow-inner shadow-zinc-200/40' : 'hover:bg-zinc-50/80'
          )}
          aria-label={`${section.title} navigation group`}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">{section.title}</p>
            {!isOpen ? (
              <p className="mt-1 text-sm font-semibold text-zinc-900">{section.items.length} destinations</p>
            ) : (
              <p className="mt-1 text-xs font-medium text-zinc-500">Choose a destination</p>
            )}
          </div>
          <div
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full border bg-white text-zinc-500 shadow-sm transition-colors',
              hasActiveChild ? 'border-zinc-300 text-zinc-900' : 'border-zinc-200'
            )}
          >
            <ChevronDown className={cn('size-4 transition-transform duration-200', isOpen ? 'rotate-180' : 'rotate-0')} />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1">
        <div className="space-y-1 px-3 pb-3 pt-0.5">
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onItemSelect}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'border-zinc-900 bg-zinc-900 text-zinc-50 shadow-md shadow-zinc-900/10'
                    : 'border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute inset-y-2 left-1.5 w-1 rounded-full bg-white/80" />}
                  <item.icon className="size-4.5 shrink-0" />
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
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(sidebarSections.map((section) => [section.title, true]))
  );

  const closeSidebar = () => setIsSidebarOpen(false);

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
    <div className="mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-3 pr-1 [scrollbar-gutter:stable]">
      <div className="rounded-3xl border border-zinc-200/80 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),rgba(244,244,245,0.88),rgba(228,228,231,0.72))] p-4 shadow-lg shadow-zinc-200/50">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 shadow-sm shadow-zinc-900/20">
            <Sparkles className="size-5 text-zinc-50" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Smart Exam Scheduler</p>
            <h2 className="mt-1 truncate text-[15px] font-semibold tracking-tight text-zinc-950">Admin Dashboard</h2>
          </div>
        </div>
      </div>

      <div className="space-y-3 pb-2">
        {sidebarSections.map((section) => (
          <SectionGroup
            key={section.title}
            section={section}
            isOpen={openSections[section.title] ?? true}
            onOpenChange={(open) => toggleSection(section.title, open)}
            onItemSelect={closeSidebar}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(250,250,250,1)_0%,rgba(244,244,245,0.96)_100%)] text-zinc-950 selection:bg-zinc-200">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-zinc-200/30 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-sky-100/40 blur-3xl" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[320px] flex-col border-r border-zinc-200/70 bg-white/70 px-4 py-4 backdrop-blur-xl md:flex">
        {sidebarContent}
      </aside>

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-zinc-950/35 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-dvh w-[86vw] max-w-[320px] flex-col border-r border-zinc-200/70 bg-white/88 px-4 py-4 backdrop-blur-xl transition-transform duration-300 ease-out md:hidden',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="mb-3 flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close menu"
            onClick={closeSidebar}
            className="rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="size-5" />
          </Button>
        </div>
        {sidebarContent}
      </aside>

      <div className="flex min-h-screen flex-col md:pl-80">
        <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/72 backdrop-blur-xl">
          <div className="flex h-19 items-center gap-4 px-4 sm:px-6 lg:px-8">
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

            <div className="relative hidden max-w-xl flex-1 md:block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search students, schedules, rooms, supervisors..."
                className="h-11 rounded-full border-zinc-200/80 bg-zinc-50/70 pl-10 pr-4 text-sm shadow-none transition-colors hover:bg-zinc-50 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-zinc-300"
              />
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                className="relative rounded-full border border-zinc-200/70 bg-white/80 text-zinc-500 shadow-sm hover:bg-zinc-100 hover:text-zinc-900"
              >
                <Bell className="size-4.5" />
                <span className="absolute right-2.5 top-2.5 size-2 rounded-full border-2 border-white bg-emerald-500" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/80 px-2.5 py-2 shadow-sm shadow-zinc-200/40 transition-all hover:border-zinc-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                  >
                    <div className="hidden min-w-0 text-right sm:block">
                      <p className="truncate text-sm font-semibold text-zinc-950">{userName}</p>
                      <p className="mt-0.5 truncate text-xs font-medium text-zinc-500">{userRole}</p>
                    </div>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-zinc-50 shadow-sm shadow-zinc-900/15">
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

        <section className="px-4 pt-5 sm:px-6 lg:px-8">
          <Card className="overflow-hidden rounded-[28px] border-zinc-200/80 bg-white/78 shadow-lg shadow-zinc-200/45 backdrop-blur-xl">
            <CardContent className="p-5 sm:p-6">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                  <span>Admin</span>
                  <ChevronRight className="size-3.5" />
                  <span>{currentPage.title}</span>
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{currentPage.title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{currentPage.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <main className="flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-360 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="rounded-[28px] border border-zinc-200/70 bg-white/58 p-2 shadow-[0_20px_60px_rgba(24,24,27,0.06)] backdrop-blur-sm sm:p-3">
              <div className="min-h-[calc(100vh-240px)] rounded-[22px] bg-transparent">
                <Outlet />
              </div>
            </div>
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
    </div>
  );
};
