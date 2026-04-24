import React from 'react';
import { Users, BookOpen, AlertTriangle, CheckCircle, CalendarClock, Sparkles, ArrowRight, TrendingUp, CalendarDays, Cpu, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageSpinner } from '@/components/shared/PageSpinner';
import { DashboardCharts } from '@/components/shared/DashboardCharts';

const stats = [
  { title: 'Total Students', value: '12,450', icon: Users, trend: '+5.2%' },
  { title: 'Exams Scheduled', value: '342', icon: BookOpen, trend: '+12 this week' },
  { title: 'Scheduling Conflicts', value: '3', icon: AlertTriangle, trend: '-2 resolved today' },
  { title: 'System Health', value: 'Optimal', icon: CheckCircle, trend: '99.8% uptime' },
];

const upcomingExams = [
  { course: 'Advanced Algorithms', date: 'May 12, 2026', room: 'A102', supervisor: 'Dr. Hassan Ali', status: 'Finalized' },
  { course: 'Database Systems', date: 'May 13, 2026', room: 'B201', supervisor: 'Ms. Laila Farouk', status: 'Published' },
  { course: 'Software Architecture', date: 'May 14, 2026', room: 'C303', supervisor: 'Dr. Kareem Nasser', status: 'Draft' },
];

const quickSignals = [
  { label: 'Next exam window', value: 'May 12 - 18', icon: CalendarDays },
  { label: 'AI score', value: '91 / 100', icon: Cpu },
  { label: 'Best capacity block', value: 'North Center', icon: MapPin },
];

export const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <PageSpinner label="Loading dashboard" />;
  }

  return (
    <div className="p-5 sm:p-6 lg:p-8 space-y-6">
      {/* Hero card */}
      <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.5fr_0.9fr] lg:p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              <TrendingUp className="size-3.5" />
              System Overview
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">Smart Exam Scheduler</h1>
              <p className="max-w-2xl text-sm leading-6 text-zinc-500">
                Live operational snapshot of exam scheduling, conflict monitoring, and AI-guided planning built for fast decisions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button className="rounded-none bg-zinc-950 text-white hover:bg-zinc-800">Open Schedule Pipeline</Button>
              <Button variant="outline" className="rounded-none">View Conflicts</Button>
            </div>
          </div>

          <div className="grid gap-2.5">
            {quickSignals.map((signal) => (
              <div key={signal.label} className="flex items-center justify-between rounded-none border border-zinc-200/60 bg-zinc-50 p-4">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">{signal.label}</p>
                  <p className="text-sm font-semibold text-zinc-950">{signal.value}</p>
                </div>
                <signal.icon className="size-4.5 text-zinc-400" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="rounded-none border border-zinc-200/60 bg-white shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="flex items-start justify-between p-5">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">{stat.title}</p>
                <p className="text-2xl font-bold tracking-tight text-zinc-950">{stat.value}</p>
                <p className="text-xs text-zinc-500">{stat.trend}</p>
              </div>
              <div className="rounded-none bg-zinc-100 p-2.5 text-zinc-600">
                <stat.icon className="size-4.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <DashboardCharts />

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.95fr]">
        <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm">
          <CardHeader className="border-b border-zinc-100 px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
              <CalendarClock className="size-4 text-zinc-400" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-zinc-100 p-0">
            {upcomingExams.map((exam, index) => (
              <div
                key={`${exam.course}-${index}`}
                className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-950">{exam.course}</p>
                    <span className="rounded-none border border-zinc-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                      {exam.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {exam.date} · {exam.room} · {exam.supervisor}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-fit rounded-none">
                  Open
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm">
          <CardHeader className="border-b border-zinc-100 px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
              <Sparkles className="size-4 text-zinc-400" />
              AI Scheduling Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            <div className="rounded-none border border-zinc-200/60 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
              AI suggests moving CS401 to the 10:00 AM slot to reduce overlap risk by 17%.
            </div>
            <div className="rounded-none border border-zinc-200/60 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
              Room utilization can improve by 11% by rebalancing two large exams to North Center.
            </div>
            <Button variant="outline" className="w-full rounded-none sm:w-auto">Open AI Optimizer</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
