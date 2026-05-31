import { BookOpen, CalendarClock, LayoutDashboard, Settings } from 'lucide-react';
import { RoleDashboardLayout, type RoleNavSection } from './RoleDashboardLayout';

const studentNavSections: RoleNavSection[] = [
  {
    title: 'sections.main',
    icon: LayoutDashboard,
    flat: true,
    items: [
      { label: 'items.dashboard', to: '/student/dashboard', icon: LayoutDashboard },
      { label: 'items.examSchedule', to: '/student/schedule', icon: CalendarClock },
      { label: 'items.courses', to: '/student/courses', icon: BookOpen },
    ],
  },
  {
    title: 'sections.configuration',
    icon: Settings,
    items: [{ label: 'items.settings', to: '/student/settings', icon: Settings }],
  },
];

export default function StudentLayout() {
  return (
    <RoleDashboardLayout
      roleName="Student"
      portalTitle="Student Dashboard"
      breadcrumbRoot="Student"
      storageKey="student-sidebar-collapsed"
      navSections={studentNavSections}
      fallbackName="Student User"
      fallbackInitials="SU"
      searchPlaceholder="Search schedules, courses, exams..."
    />
  );
}
