import React from 'react';
import { Users, BookOpen, AlertTriangle, CheckCircle, CalendarClock, Sparkles, ArrowRight, TrendingUp, CalendarDays, Cpu, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageSpinner } from '@/components/shared/PageSpinner';

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
    const timer = window.setTimeout(() => setIsLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <PageSpinner label="Loading dashboard" />;
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="bg-linear-to-r from-primary/10 via-background to-background">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.5fr_0.9fr] lg:p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                <TrendingUp className="size-4" />
                System Overview
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Smart Exam Scheduler</h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Live operational snapshot of exam scheduling, conflict monitoring, and AI-guided planning built for fast decisions.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button>Open Schedule Pipeline</Button>
                <Button variant="outline">View Conflicts</Button>
              </div>
            </div>

            <div className="grid gap-3">
              {quickSignals.map((signal) => (
                <div key={signal.label} className="flex items-center justify-between rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{signal.label}</p>
                    <p className="text-sm font-semibold">{signal.value}</p>
                  </div>
                  <signal.icon className="size-5 text-primary" />
                </div>
              ))}
            </div>
          </CardContent>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <CardContent className="flex items-start justify-between p-5">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.trend}</p>
              </div>
              <div className="rounded-2xl bg-secondary p-3 text-foreground shadow-sm">
                <stat.icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CalendarClock className="size-4" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingExams.map((exam, index) => (
              <div
                key={`${exam.course}-${index}`}
                className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:border-border/70 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold sm:text-base">{exam.course}</p>
                    <span className="rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {exam.status}
                    </span>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground sm:text-sm">
                    {exam.date} • {exam.room} • {exam.supervisor}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-fit">
                  Open
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="size-4" />
              AI Scheduling Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border bg-secondary/30 p-4 text-sm leading-6">
              AI suggests moving CS401 to the 10:00 AM slot to reduce overlap risk by 17%.
            </div>
            <div className="rounded-xl border bg-secondary/30 p-4 text-sm leading-6">
              Room utilization can improve by 11% by rebalancing two large exams to North Center.
            </div>
            <Button variant="outline" className="w-full sm:w-auto">Open AI Optimizer</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
