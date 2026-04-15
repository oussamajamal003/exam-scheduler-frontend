import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  BookOpen, 
  MapPin, 
  UserSquare, 
  CalendarDays, 
  AlertTriangle, 
  Settings,
  Sparkles,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { env } from '@/config/env';
import { useLogout } from '@/hooks/auth/useLogout';

const mainNavItems = [
  { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
  { name: 'Schedules', path: '/schedule', icon: CalendarDays },
  { name: 'Conflicts', path: '/conflicts', icon: AlertTriangle },
  { name: 'AI Optimizer', path: '/ai', icon: Sparkles },
];

const managementItems = [
  { name: 'Students', path: '/students', icon: GraduationCap },
  { name: 'Courses', path: '/courses', icon: BookOpen },
  { name: 'Supervisors', path: '/supervisors', icon: UserSquare },
  { name: 'Rooms & Centers', path: '/rooms', icon: MapPin },
];

export const Sidebar: React.FC = () => {
  const logoutMutation = useLogout();

  return (
    <aside className="w-64 bg-background border-r border-border min-h-screen flex-col hidden md:flex sticky top-0 z-40">
      <div className="h-16 flex items-center px-6 border-b border-border font-bold text-xl tracking-tight text-primary">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <BookOpen className="w-5 h-5" />
          </div>
          <span>{env.APP_NAME || 'SmartSIS'}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 py-6 px-4 overflow-y-auto custom-scrollbar">
        {/* Core Scheduling */}
        <div className="flex flex-col gap-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Overview
          </p>
          {mainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                  )}
                  <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-primary" : "opacity-80 group-hover:opacity-100 group-hover:text-foreground")} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Management */}
        <div className="flex flex-col gap-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4 inline-flex items-center gap-2">
            Management
          </p>
          {managementItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                  )}
                  <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-primary" : "opacity-80 group-hover:opacity-100 group-hover:text-foreground")} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-border bg-muted/20">
        <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-1",
                isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )
            }
          >
            <Settings className="w-4 h-4" />
            Settings
          </NavLink>
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="w-4 h-4" />
          {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </aside>
  );
};
