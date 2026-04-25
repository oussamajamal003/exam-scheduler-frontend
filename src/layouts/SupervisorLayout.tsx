import { CalendarClock, ClipboardList, LayoutDashboard, Settings } from 'lucide-react';
import { RoleDashboardLayout, type RoleNavSection } from './RoleDashboardLayout';

const supervisorNavSections: RoleNavSection[] = [
  {
    title: 'Main',
    icon: LayoutDashboard,
    flat: true,
    items: [
      { label: 'Dashboard', to: '/supervisor/dashboard', icon: LayoutDashboard },
      { label: 'Exam Schedule', to: '/supervisor/schedule', icon: CalendarClock },
      { label: 'Assigned Students', to: '/supervisor/students', icon: ClipboardList },
    ],
  },
  {
    title: 'Configuration',
    icon: Settings,
    items: [{ label: 'Settings', to: '/supervisor/settings', icon: Settings }],
  },
];

export default function SupervisorLayout() {
  return (
    <RoleDashboardLayout
      roleName="Supervisor"
      portalTitle="Supervisor Dashboard"
      breadcrumbRoot="Supervisor"
      storageKey="supervisor-sidebar-collapsed"
      navSections={supervisorNavSections}
      fallbackName="Supervisor User"
      fallbackInitials="SV"
      profilePath="/supervisor/settings"
      searchPlaceholder="Search schedules, students, assignments..."
    />
  );
}