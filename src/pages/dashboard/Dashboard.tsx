import React from 'react';
import { Users, BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
}

const StatCard = ({ title, value, icon: Icon, trend }: StatCardProps) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-600">
        <Icon className="w-6 h-6" />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm">
        <span className="text-emerald-600 font-medium">{trend}</span>
        <span className="text-slate-500 ml-2">vs last semester</span>
      </div>
    )}
  </div>
);

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of the current exam scheduling period.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value="12,450" icon={Users} trend="+5.2%" />
        <StatCard title="Exams Scheduled" value="342" icon={BookOpen} trend="+12" />
        <StatCard title="Scheduling Conflicts" value="3" icon={AlertTriangle} />
        <StatCard title="System Status" value="Optimal" icon={CheckCircle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm min-h-75">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Schedule</h2>
          <div className="flex items-center justify-center h-48 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
            Schedule Chart Placeholder
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm min-h-75">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Alerts</h2>
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 text-amber-800 rounded-md border border-amber-100 text-sm">
              Warning: Room A102 is double-booked on May 12th.
            </div>
            <div className="p-3 bg-slate-50 text-slate-700 rounded-md border border-slate-100 text-sm">
              Info: Supervisor generation completed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
