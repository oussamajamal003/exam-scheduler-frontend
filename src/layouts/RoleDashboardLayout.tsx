import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { User } from '@/api/auth.api';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { useLogout } from '@/hooks/auth/useLogout';
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
  profilePath: string;
  searchPlaceholder: string;
};

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
              <Tooltip key={item.to} delayDuration={300}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.to}
                    onClick={onItemSelect}
                    aria-label={item.label}
                    className={cn(
                      'mx-auto flex size-11 items-center justify-center rounded-2xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300',
                      isActive
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-lg shadow-zinc-900/15'
                        : 'border-zinc-200/70 bg-white/75 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950'
                    )}
                  >
                    <ItemIcon className="size-5" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={20} className="z-50 font-semibold">
                  {item.label}
                </TooltipContent>
              </Tooltip>
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
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              )}
            >
              {isActive && <span className="absolute inset-y-2 left-1.5 w-0.5 rounded-full bg-white/60" />}
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
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`${section.title} navigation`}
                className={cn(
                  'mx-auto flex size-11 items-center justify-center rounded-2xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300',
                  hasActiveChild
                    ? 'border-zinc-950 bg-zinc-950 text-white shadow-lg shadow-zinc-900/15'
                    : 'border-zinc-200/70 bg-white/75 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950'
                )}
              >
                <SectionIcon className="size-5" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={20} className="font-semibold">
            {section.title}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="right" align="start" sideOffset={14} className="w-64 rounded-2xl p-2">
          <DropdownMenuLabel>{section.title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {section.items.map((item) => {
            const isActive = location.pathname === item.to;
            const ItemIcon = item.icon;
            return (
              <DropdownMenuItem
                key={item.to}
                asChild
                className={cn(isActive && 'bg-zinc-950 text-white focus:bg-zinc-950 focus:text-white')}
              >
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
          className="group mb-1 flex w-full items-center justify-between rounded-md bg-zinc-100 px-2.5 py-1.5 transition-colors duration-150 hover:bg-zinc-200/70"
          aria-label={`${section.title} navigation group`}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 transition-colors duration-150 group-hover:text-zinc-700">
            {section.title}
          </span>
          <ChevronDown
            className={cn('size-3 text-zinc-400 transition-transform duration-200', isOpen ? 'rotate-180' : '')}
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
                      ? 'bg-zinc-950 text-white shadow-sm'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute inset-y-2 left-1.5 w-0.5 rounded-full bg-white/60" />}
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
  profilePath,
  searchPlaceholder,
}) => {
  const location = useLocation();
  const logoutMutation = useLogout();
  const { data } = useCurrentUser();
  const currentUser = data as User | undefined;

  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(() => localStorage.getItem(storageKey) === 'true');
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(navSections.map((section) => [section.title, true]))
  );

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
  const userRole = formatRole(currentUser?.role ?? tokenPayload?.role, roleName);
  const userInitials = getInitials(currentUser?.name ?? tokenPayload?.name, fallbackInitials);

  const allItems = navSections.flatMap((section) => section.items);
  const currentPage =
    allItems.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)) ??
    allItems[0];

  const toggleSection = (title: string, open: boolean) => {
    setOpenSections((prev) => ({ ...prev, [title]: open }));
  };

  const sidebarAccountMenu = (
    <DropdownMenu>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open account menu"
              className={cn(
                'group mt-4 flex shrink-0 items-center border border-zinc-200/80 bg-white/85 shadow-sm shadow-zinc-200/40 transition-all duration-300 hover:border-zinc-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300',
                isCollapsed ? 'mx-auto size-12 justify-center rounded-2xl p-0' : 'w-full gap-3 rounded-2xl px-3 py-3'
              )}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-xs font-bold text-white shadow-sm shadow-zinc-900/15 transition-all duration-300">
                {userInitials}
              </div>
              <div
                className={cn(
                  'min-w-0 overflow-hidden whitespace-nowrap text-left transition-all duration-300',
                  isCollapsed ? 'w-0 px-0 opacity-0' : 'w-full opacity-100'
                )}
              >
                <p className="truncate text-sm font-bold text-zinc-950">{userName}</p>
                <p className="mt-0.5 truncate text-xs font-medium text-zinc-500">{userRole}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right" sideOffset={14} className="font-medium">
            {userName} &middot; {userRole}
          </TooltipContent>
        )}
      </Tooltip>
      <DropdownMenuContent
        side={isCollapsed ? 'right' : 'top'}
        align={isCollapsed ? 'center' : 'start'}
        sideOffset={14}
        className="w-64 rounded-2xl p-2"
      >
        <DropdownMenuLabel>
          <div className="space-y-1 normal-case tracking-normal">
            <p className="text-sm font-semibold tracking-tight text-zinc-950">{userName}</p>
            <p className="text-xs font-medium text-zinc-500">{userRole}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={profilePath} className="cursor-pointer" onClick={closeSidebar}>
            <UserRound className="size-4" />
            <span>Manage Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setIsLogoutModalOpen(true)}>
          <LogOut className="size-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const sidebarContent = (
    <>
      <div
        className={cn(
          'mb-3 flex shrink-0 items-center border-b border-zinc-100 pb-4 transition-all duration-300',
          isCollapsed ? 'justify-center px-0' : 'gap-3 px-2'
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-950 shadow-sm">
          <Sparkles className="size-4 text-zinc-50" />
        </div>
        <div
          className={cn(
            'min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300',
            isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'
          )}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Smart Exam Scheduler</p>
          <h2 className="mt-0.5 truncate text-sm font-bold leading-none text-zinc-950">{portalTitle}</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
          onClick={toggleSidebarCollapse}
          className={cn(
            'z-10 size-8 shrink-0 rounded-xl border border-zinc-200/70 bg-white text-zinc-500 shadow-sm transition-all hover:bg-zinc-100 hover:text-zinc-950',
            isCollapsed ? 'absolute -right-4 top-4' : 'ml-auto'
          )}
        >
          {isCollapsed ? <PanelLeftOpen className="size-4.5" /> : <PanelLeftClose className="size-4.5" />}
        </Button>
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-3 pr-0.5 [scrollbar-gutter:stable]"
        aria-label={`${roleName} navigation`}
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

      {sidebarAccountMenu}
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
            'fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-zinc-200/70 bg-white/70 px-4 py-4 backdrop-blur-xl transition-[width] duration-300 ease-out md:flex',
            isCollapsed ? 'w-24' : 'w-80'
          )}
        >
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
            'fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-zinc-200/70 bg-white/88 px-4 py-4 backdrop-blur-xl transition-[transform,width,max-width] duration-300 ease-out md:hidden',
            isCollapsed ? 'w-24 max-w-24' : 'w-[86vw] max-w-[320px]',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {sidebarContent}
        </aside>

        <div
          className={cn(
            'flex min-h-screen flex-col transition-[padding-left] duration-300 ease-out',
            isCollapsed ? 'md:pl-24' : 'md:pl-80'
          )}
        >
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
                  placeholder={searchPlaceholder}
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
                      aria-label="Open account menu"
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
                      <Link to={profilePath} className="cursor-pointer">
                        <UserRound className="size-4" />
                        <span>Manage Profile</span>
                      </Link>
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
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400"
            >
              <span>{breadcrumbRoot}</span>
              <ChevronRight className="size-3" />
              <span className="text-zinc-500">{currentPage.label}</span>
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
      </div>
    </TooltipProvider>
  );
};
