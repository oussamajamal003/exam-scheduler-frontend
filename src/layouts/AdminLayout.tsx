import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarClock,
  AlertTriangle,
  Sparkles,
  Users,
  BookOpen,
  UserCog,
  Building2,
  Settings,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLogout } from '@/hooks/auth/useLogout';
import { DeleteConfirmModal } from '@/components/shared/DeleteConfirmModal';

const overviewItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Schedules', to: '/schedule', icon: CalendarClock },
  { label: 'Conflicts', to: '/conflicts', icon: AlertTriangle },
  { label: 'AI Optimizer', to: '/ai', icon: Sparkles },
];

const managementItems = [
  { label: 'Students', to: '/students', icon: Users },
  { label: 'Courses', to: '/courses', icon: BookOpen },
  { label: 'Supervisors', to: '/supervisors', icon: UserCog },
  { label: 'Rooms & Centers', to: '/rooms', icon: Building2 },
];

export const AdminLayout: React.FC = () => {
  const logoutMutation = useLogout();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  const renderNavItems = (items: typeof overviewItems) =>
    items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={closeSidebar}
        className={({ isActive }) =>
          cn(
            'group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200',
            isActive 
              ? 'border-zinc-900 bg-zinc-900 text-zinc-50 shadow-md shadow-zinc-900/10' 
              : 'border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900'
          )
        }
      >
        <item.icon className="size-4.5" />
        <span>{item.label}</span>
      </NavLink>
    ));

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] font-sans selection:bg-zinc-200">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-67.5 flex-col border-r border-zinc-200/60 bg-white/60 p-4 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-3 px-2 py-3 text-zinc-950">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-zinc-950 shadow-sm shadow-zinc-900/20">
            <Sparkles className="size-5.5 text-zinc-50" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold leading-tight tracking-tight">Smart Scheduler</h2>
            <p className="text-[11px] font-medium text-zinc-500">Admin Workspace</p>
          </div>
        </div>

        <div className="mt-5 flex flex-1 flex-col gap-4 overflow-y-auto pb-2 outline-none scrollbar-hide">
          <Card className="rounded-2xl border-zinc-200/80 bg-white/70 py-3 shadow-sm shadow-zinc-200/40">
            <CardHeader className="px-3 [.border-b]:pb-2">
              <CardTitle className="px-1 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 px-3">{renderNavItems(overviewItems)}</CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200/80 bg-white/70 py-3 shadow-sm shadow-zinc-200/40">
            <CardHeader className="px-3 [.border-b]:pb-2">
              <CardTitle className="px-1 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 px-3">{renderNavItems(managementItems)}</CardContent>
          </Card>

          <Card className="mt-auto rounded-2xl border-zinc-200/80 bg-white/70 py-3 shadow-sm shadow-zinc-200/40">
            <CardContent className="space-y-1 px-3">
              <NavLink
                to="/settings"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'border-zinc-900 bg-zinc-900 text-zinc-50 shadow-md shadow-zinc-900/10'
                      : 'border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900'
                  )
                }
              >
                <Settings className="size-4.5" />
                <span>Settings</span>
              </NavLink>
              <Button
                type="button"
                variant="ghost"
                disabled={logoutMutation.isPending}
                onClick={() => setIsLogoutModalOpen(true)}
                className="h-auto w-full justify-start rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-zinc-600 hover:border-destructive/15 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="size-4.5" />
                <span>Logout</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" 
          onClick={closeSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 flex-col border-r border-zinc-200/60 bg-white/60 p-4 backdrop-blur-xl transition-transform duration-300 ease-in-out md:hidden',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center gap-3 px-2 py-3 text-zinc-950">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-zinc-950 shadow-sm shadow-zinc-900/20">
            <Sparkles className="size-5.5 text-zinc-50" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold leading-tight tracking-tight">Smart Scheduler</h2>
            <p className="text-[11px] font-medium text-zinc-500">Admin Workspace</p>
          </div>
        </div>

        <div className="mt-5 flex flex-1 flex-col gap-4 overflow-y-auto pb-2 outline-none scrollbar-hide">
          <Card className="rounded-2xl border-zinc-200/80 bg-white/70 py-3 shadow-sm shadow-zinc-200/40">
            <CardHeader className="px-3 [.border-b]:pb-2">
              <CardTitle className="px-1 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 px-3">{renderNavItems(overviewItems)}</CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200/80 bg-white/70 py-3 shadow-sm shadow-zinc-200/40">
            <CardHeader className="px-3 [.border-b]:pb-2">
              <CardTitle className="px-1 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 px-3">{renderNavItems(managementItems)}</CardContent>
          </Card>

          <Card className="mt-auto rounded-2xl border-zinc-200/80 bg-white/70 py-3 shadow-sm shadow-zinc-200/40">
            <CardContent className="space-y-1 px-3">
              <NavLink
                to="/settings"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'border-zinc-900 bg-zinc-900 text-zinc-50 shadow-md shadow-zinc-900/10'
                      : 'border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900'
                  )
                }
              >
                <Settings className="size-4.5" />
                <span>Settings</span>
              </NavLink>
              <Button
                type="button"
                variant="ghost"
                disabled={logoutMutation.isPending}
                onClick={() => setIsLogoutModalOpen(true)}
                className="h-auto w-full justify-start rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-zinc-600 hover:border-destructive/15 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="size-4.5" />
                <span>Logout</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex flex-1 flex-col md:pl-67.5">
        {/* Sleek Top Header */}
        <header className="sticky top-0 z-40 flex h-18 items-center justify-between border-b border-zinc-200/60 bg-white/60 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex w-full items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Toggle menu"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            >
              {isSidebarOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </Button>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search students, courses..."
                className="h-10 rounded-full border-zinc-200 bg-zinc-50/50 pl-10 text-sm shadow-none transition-colors hover:bg-zinc-50 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-zinc-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <Bell className="size-4.5" />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full border-2 border-white bg-destructive"></span>
            </Button>
            <div className="flex items-center gap-3 pl-1 sm:pl-2">
              <div className="flex size-9 items-center justify-center rounded-full bg-zinc-950 font-medium text-zinc-50 shadow-sm shadow-zinc-900/10">
                A
              </div>
              <div className="hidden flex-col md:flex">
                <span className="text-[13px] font-semibold leading-none text-zinc-950">Admin User</span>
                <span className="mt-0.5 text-[11px] font-medium text-zinc-500">Superadmin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-350 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Outlet />
          </div>
        </main>

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
    </div>
  );
};