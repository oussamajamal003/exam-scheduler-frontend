import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  MapPin, 
  UserSquare, 
  Calendar, 
  AlertTriangle, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { env } from '@/config/env';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', path: '/students', icon: Users },
  { name: 'Exams', path: '/exams', icon: BookOpen },
  { name: 'Rooms & Centers', path: '/rooms', icon: MapPin },
  { name: 'Supervisors', path: '/supervisors', icon: UserSquare },
  { name: 'Schedules', path: '/schedule', icon: Calendar },
  { name: 'Conflicts', path: '/conflicts', icon: AlertTriangle },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 min-h-screen text-slate-100 flex-col hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 font-bold text-lg tracking-tight">
        {env.APP_NAME}
      </div>
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )
            }
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Admin User</span>
            <span className="text-xs text-slate-500">admin@university.edu</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
