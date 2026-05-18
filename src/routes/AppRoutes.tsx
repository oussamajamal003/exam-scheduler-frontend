import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import StudentLayout from '@/layouts/StudentLayout';
import ProctorLayout from '@/layouts/ProctorLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { StudentDashboardPage } from '@/pages/student/StudentDashboardPage';
import { StudentSchedulePage } from '@/pages/student/StudentSchedulePage';
import { StudentCoursesPage } from '@/pages/student/StudentCoursesPage';
import { StudentNotificationsPage } from '@/pages/student/StudentNotificationsPage';
import { StudentSettingsPage } from '@/pages/student/StudentSettingsPage';
import { ProctorDashboardPage } from '@/pages/supervisor/ProctorDashboardPage';
import { ProctorSchedulePage } from '@/pages/supervisor/ProctorSchedulePage';
import { ProctorStudentsPage } from '@/pages/supervisor/ProctorStudentsPage';
import { ProctorSettingsPage } from '@/pages/supervisor/ProctorSettingsPage';
import { StudentsPage } from '@/pages/admin/StudentsPage';
import { CoursesPage } from '../pages/admin/CoursesPage';
import { ProctorsPage } from '@/pages/admin/ProctorsPage';
import { RoomsCentersPage } from '../pages/admin/RoomsCentersPage';
import { CentersPage } from '../pages/admin/CentersPage';
import { TimeSlotsPage } from '../pages/admin/TimeSlotsPage';
import { DepartmentsPage } from '@/pages/admin/DepartmentsPage';
import { CourseOfferingsPage } from '@/pages/admin/CourseOfferingsPage';
import { CourseOfferingDetailPage } from '@/pages/admin/CourseOfferingDetailPage';
import { EnrollmentsPage } from '@/pages/admin/EnrollmentsPage';
import { SemestersPage } from '@/pages/admin/SemestersPage';
import { SchedulesPage } from '@/pages/admin/SchedulesPage';
import { SettingsPage } from '@/pages/admin/SettingsPage';
import { NotFound } from '@/pages/NotFound';
import { PageSpinner } from '@/components/shared/PageSpinner';
import { AuthGuard, RoleGuard, GuestGuard } from '@/guards/authguard';
import { ADMIN_ROLES, getHomePathForRole, normalizeRole } from '@/lib/authRoutes';

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <PageSpinner label={`Loading ${title.toLowerCase()}`} />;
  }

  return <div className="p-4 text-zinc-950 dark:text-zinc-50">{title}</div>;
};

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

const decodeRoleFromToken = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));
    return typeof decoded.role === 'string' ? decoded.role : null;
  } catch {
    return null;
  }
};

const RootRedirect: React.FC = () => {
  const token = localStorage.getItem('token');
  const role = normalizeRole(decodeRoleFromToken(token));
  return <Navigate to={role ? getHomePathForRole(role) : '/login'} replace />;
};

export const AppRoutes: React.FC = () => {
  return ( 
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public / Auth Routes */}
        <Route element={<GuestGuard />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
        </Route>
        {/* Root → role-aware redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Protected Admin/Dashboard Routes */}
        <Route element={<AuthGuard />}>
          <Route
            element={
              <RoleGuard allowedRoles={[...ADMIN_ROLES]}>
                <AdminLayout />
              </RoleGuard>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<StudentsPage />} />

            {/* Placeholders for future modules */}
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/semesters" element={<SemestersPage />} />
            <Route path="/course-offerings" element={<CourseOfferingsPage />} />
            <Route path="/course-offerings/:id" element={<CourseOfferingDetailPage />} />
            <Route path="/enrollments" element={<EnrollmentsPage />} />
            <Route path="/exams" element={<PlaceholderPage title="Exams Management" />} />
            <Route path="/rooms" element={<RoomsCentersPage />} />
            <Route path="/centers" element={<CentersPage />} />
            <Route path="/proctors" element={<ProctorsPage />} />
            <Route path="/timeslots" element={<TimeSlotsPage />} />
            <Route path="/schedule" element={<SchedulesPage />} />
            <Route path="/schedules" element={<SchedulesPage />} />
            <Route path="/scheduling" element={<SchedulesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route
            element={
              <RoleGuard allowedRoles={['STUDENT']}>
                <StudentLayout />
              </RoleGuard>
            }
          >
            <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/student/dashboard" element={<StudentDashboardPage />} />
            <Route path="/student/schedule" element={<StudentSchedulePage />} />
            <Route path="/student/courses" element={<StudentCoursesPage />} />
            <Route path="/student/notifications" element={<StudentNotificationsPage />} />
            <Route path="/student/settings" element={<StudentSettingsPage />} />
          </Route>

          <Route
            element={
              <RoleGuard allowedRoles={['PROCTOR']}>
                <ProctorLayout />
              </RoleGuard>
            }
          >
            <Route path="/proctor" element={<Navigate to="/proctor/dashboard" replace />} />
            <Route path="/proctor/dashboard" element={<ProctorDashboardPage />} />
            <Route path="/proctor/schedule" element={<ProctorSchedulePage />} />
            <Route path="/proctor/students" element={<ProctorStudentsPage />} />
            <Route path="/proctor/settings" element={<ProctorSettingsPage />} />
          </Route>
        </Route>

        {/* Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
