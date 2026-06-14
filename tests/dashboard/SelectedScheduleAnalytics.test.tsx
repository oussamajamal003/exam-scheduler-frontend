import React from 'react';
import { render, screen } from '@testing-library/react';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('@/hooks/auth/useCurrentUser', () => ({
  useCurrentUser: () => ({
    data: { name: 'Test Admin' },
    isLoading: false,
  }),
}));

jest.mock('@/hooks/dashboard/useDashboardSummary', () => ({
  useDashboardSummary: () => ({
    counts: {
      totalStudents: 120,
      totalCourses: 32,
      totalRooms: 8,
      totalProctors: 18,
      totalSchedules: 3,
      publishedAssignments: 44,
      activeExamPeriods: 1,
    },
    sortedSchedules: [{ id: 'schedule-1', name: 'Final Schedule', isFinal: true }],
    activeSemester: {
      name: 'Spring 2026',
      startDate: '2026-06-08',
      endDate: '2026-06-22',
    },
    isLoading: false,
  }),
}));

jest.mock('@/hooks/dashboard/useDashboardAnalytics', () => ({
  useDashboardAnalytics: () => ({
    selectedSchedule: { id: 'schedule-1', name: 'Final Schedule', isFinal: true },
    selectedDetailed: { id: 'schedule-1', name: 'Final Schedule', isFinal: true },
    assignments: [],
    qualityMetrics: {
      roomUtilization: 84,
      proctorWorkloadBalance: 91,
      studentSpacing: 77,
      examDistribution: 88,
    },
    weakAreas: [],
    charts: {
      byRoom: [],
      byProctor: [],
      byDay: [],
      byCenter: [],
      qualityMetricBars: [],
    },
    qualityScores: {
      qualityScore: 89,
      hardConstraintScore: 100,
      softConstraintScore: 84,
      overallQuality: 90,
    },
    totalConflicts: 0,
    status: {
      tone: 'success',
      label: 'Final schedule published',
      description: 'Selected schedule is live.',
      statusLabel: 'Live',
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: async () => {},
  }),
}));

jest.mock('@/components/dashboard/DashboardHeader', () => ({
  DashboardHeader: (props: any) => (
    <div>
      <div>{props.userName}</div>
      <div>{props.semesterName}</div>
      <div>{props.scheduleStatusLabel}</div>
    </div>
  ),
}));

jest.mock('@/components/dashboard/AnalyticsCard', () => ({
  AnalyticsCard: (props: any) => (
    <div>
      <div>{props.title}</div>
      <div>{String(props.value)}</div>
    </div>
  ),
}));

jest.mock('@/components/dashboard/SmartStatusCard', () => ({
  SmartStatusCard: (props: any) => (
    <div>
      <div>{props.title}</div>
      <div>{props.description}</div>
    </div>
  ),
}));

jest.mock('@/components/dashboard/RealBarChart', () => ({
  RealBarChart: (props: any) => <div>{props.title}</div>,
}));

jest.mock('@/components/dashboard/EvaluationSummary', () => ({
  EvaluationSummary: (props: any) => (
    <div>
      <div>{String(props.qualityScore)}</div>
      <div>{String(props.hardConstraintScore)}</div>
      <div>{String(props.softConstraintScore)}</div>
    </div>
  ),
}));

jest.mock('@/components/dashboard/ScheduleOverview', () => ({
  ScheduleOverview: () => <div>Schedule Overview</div>,
}));

jest.mock('@/components/dashboard/QuickActions', () => ({
  QuickActions: () => <div>Quick Actions</div>,
}));

import { Dashboard } from '../../src/pages/dashboard/Dashboard';

describe('Dashboard Selected Schedule Analytics', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    localStorage.clear();
  });

  it('displays Room Utilization and Proctor Balance scores in the selected schedule analytics card', () => {
    render(<Dashboard />);

    expect(screen.getByText('Selected Schedule Analytics')).toBeInTheDocument();
    expect(screen.getByText('Room Utilization')).toBeInTheDocument();
    expect(screen.getByText('84%')).toBeInTheDocument();
    expect(screen.getByText('Proctor Balance')).toBeInTheDocument();
    expect(screen.getByText('91%')).toBeInTheDocument();
  });
});
