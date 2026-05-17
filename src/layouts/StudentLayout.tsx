import { BookOpen, CalendarClock, LayoutDashboard, Settings } from 'lucide-react';
import { RoleDashboardLayout, type RoleNavSection } from './RoleDashboardLayout';

const studentNavSections: RoleNavSection[] = [
  {
    title: 'Main',
    icon: LayoutDashboard,
    flat: true,
    items: [
      { label: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
      { label: 'Exam Schedule', to: '/student/schedule', icon: CalendarClock },
      { label: 'Courses', to: '/student/courses', icon: BookOpen },
    ],
  },
  {
    title: 'Configuration',
    icon: Settings,
    items: [{ label: 'Settings', to: '/student/settings', icon: Settings }],
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
