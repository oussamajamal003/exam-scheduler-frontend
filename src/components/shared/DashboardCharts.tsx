import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, MapPin, UserCheck } from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  title: string;
  data: ChartData[];
  icon: React.ComponentType<{ className?: string }>;
  type?: 'bar' | 'pie';
}

const SimpleChart: React.FC<SimpleChartProps> = ({ title, data, icon: Icon, type = 'bar' }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {type === 'bar' ? (
          <div className="space-y-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center">
                <div className="w-20 text-xs text-muted-foreground truncate">
                  {item.name}
                </div>
                <div className="flex-1 ml-2">
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.value / maxValue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="ml-2 text-xs font-medium w-8 text-right">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{data.reduce((sum, item) => sum + item.value, 0)}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const DashboardCharts: React.FC = () => {
  // Mock data - in a real app, this would come from your API 
  const studentData: ChartData[] = [
    { name: 'CS', value: 450 },
    { name: 'IT', value: 380 },
    { name: 'EE', value: 320 },
    { name: 'ME', value: 290 },
    { name: 'CE', value: 250 },
  ];

  const courseData: ChartData[] = [
    { name: 'Algorithms', value: 120 },
    { name: 'Databases', value: 95 },
    { name: 'Networks', value: 85 },
    { name: 'AI', value: 75 },
    { name: 'Security', value: 65 },
  ];

  const roomData: ChartData[] = [
    { name: 'North Center', value: 85 },
    { name: 'South Wing', value: 72 },
    { name: 'East Hall', value: 68 },
    { name: 'West Block', value: 55 },
  ];

  const supervisorData: ChartData[] = [
    { name: 'Dr. Ahmed', value: 8 },
    { name: 'Dr. Fatima', value: 7 },
    { name: 'Dr. Omar', value: 6 },
    { name: 'Dr. Layla', value: 5 },
    { name: 'Dr. Hassan', value: 4 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <SimpleChart
        title="Students by Department"
        data={studentData}
        icon={Users}
        type="bar"
      />
      <SimpleChart
        title="Courses Offered"
        data={courseData}
        icon={BookOpen}
        type="bar"
      />
      <SimpleChart
        title="Room Utilization (%)"
        data={roomData}
        icon={MapPin}
        type="bar"
      />
      <SimpleChart
        title="Supervisor Workload"
        data={supervisorData}
        icon={UserCheck}
        type="bar"
      />
    </div>
  );
};