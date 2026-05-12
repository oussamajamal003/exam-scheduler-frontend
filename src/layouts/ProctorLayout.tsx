import { CalendarClock, ClipboardList, LayoutDashboard, Settings } from 'lucide-react';
import { RoleDashboardLayout, type RoleNavSection } from './RoleDashboardLayout';

const proctorNavSections: RoleNavSection[] = [
  {
    title: 'Main',
    icon: LayoutDashboard,
    flat: true,
    items: [
      { label: 'Dashboard', to: '/proctor/dashboard', icon: LayoutDashboard },
      { label: 'Exam Schedule', to: '/proctor/schedule', icon: CalendarClock },
      { label: 'Assigned Students', to: '/proctor/students', icon: ClipboardList },
    ],
  },
  {
    title: 'Configuration',
    icon: Settings,
    items: [{ label: 'Settings', to: '/proctor/settings', icon: Settings }],
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
      profilePath="/proctor/settings"
      searchPlaceholder="Search schedules, students, assignments..."
    />
  );
}