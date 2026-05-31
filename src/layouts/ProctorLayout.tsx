import { CalendarClock, ClipboardList, LayoutDashboard, Settings } from 'lucide-react';
import { RoleDashboardLayout, type RoleNavSection } from './RoleDashboardLayout';

const proctorNavSections: RoleNavSection[] = [
  {
    title: 'sections.main',
    icon: LayoutDashboard,
    flat: true,
    items: [
      { label: 'items.dashboard', to: '/proctor/dashboard', icon: LayoutDashboard },
      { label: 'items.examSchedule', to: '/proctor/schedule', icon: CalendarClock },
      { label: 'items.assignedStudents', to: '/proctor/students', icon: ClipboardList },
    ],
  },
  {
    title: 'sections.configuration',
    icon: Settings,
    items: [{ label: 'items.settings', to: '/proctor/settings', icon: Settings }],
  },
];

export default function ProctorLayout() {
  return (
    <RoleDashboardLayout
      roleName="Proctor"
      portalTitle="Proctor Dashboard"
      breadcrumbRoot="Proctor"
      storageKey="proctor-sidebar-collapsed"
      navSections={proctorNavSections}
      fallbackName="Proctor User"
      fallbackInitials="SV"
      searchPlaceholder="Search schedules, students, assignments..."
    />
  );
}