import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import StudentLayout from '@/layouts/StudentLayout';
import SupervisorLayout from '@/layouts/SupervisorLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { StudentsPage } from '@/pages/admin/StudentsPage';
import { AIOptimizerPage } from '@/pages/admin/AIOptimizerPage';
import { CoursesPage } from '../pages/admin/CoursesPage';
import { SupervisorsPage } from '@/pages/admin/SupervisorsPage';
import { RoomsCentersPage } from '../pages/admin/RoomsCentersPage';
import { CentersPage } from '../pages/admin/CentersPage';
import { TimeSlotsPage } from '../pages/admin/TimeSlotsPage';
import { DepartmentsPage } from '@/pages/admin/DepartmentsPage';
import { CourseOfferingsPage } from '@/pages/admin/CourseOfferingsPage';
import { CourseOfferingDetailPage } from '@/pages/admin/CourseOfferingDetailPage';
import { EnrollmentsPage } from '@/pages/admin/EnrollmentsPage';
import { SemestersPage } from '@/pages/admin/SemestersPage';
import { SchedulesPage } from '@/pages/admin/SchedulesPage';
import { ConflictsPage } from '@/pages/admin/ConflictsPage';
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

  return <div className="p-4 text-zinc-950">{title}</div>;
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
            <Route path="/ai" element={<AIOptimizerPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/semesters" element={<SemestersPage />} />
            <Route path="/course-offerings" element={<CourseOfferingsPage />} />
            <Route path="/course-offerings/:id" element={<CourseOfferingDetailPage />} />
            <Route path="/enrollments" element={<EnrollmentsPage />} />
            <Route path="/exams" element={<PlaceholderPage title="Exams Management" />} />
            <Route path="/rooms" element={<RoomsCentersPage />} />
            <Route path="/centers" element={<CentersPage />} />
            <Route path="/supervisors" element={<SupervisorsPage />} />
            <Route path="/timeslots" element={<TimeSlotsPage />} />
            <Route path="/schedule" element={<SchedulesPage />} />
            <Route path="/schedules" element={<SchedulesPage />} />
            <Route path="/scheduling" element={<SchedulesPage />} />
            <Route path="/conflicts" element={<ConflictsPage />} />
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
            <Route path="/student/dashboard" element={<PlaceholderPage title="Student Dashboard" />} />
            <Route path="/student/schedule" element={<PlaceholderPage title="Student Exam Schedule" />} />
            <Route path="/student/courses" element={<PlaceholderPage title="Student Courses" />} />
            <Route path="/student/settings" element={<PlaceholderPage title="Student Settings" />} />
          </Route>

          <Route
            element={
              <RoleGuard allowedRoles={['SUPERVISOR']}>
                <SupervisorLayout />
              </RoleGuard>
            }
          >
            <Route path="/supervisor" element={<Navigate to="/supervisor/dashboard" replace />} />
            <Route path="/supervisor/dashboard" element={<PlaceholderPage title="Supervisor Dashboard" />} />
            <Route path="/supervisor/schedule" element={<PlaceholderPage title="Supervisor Exam Schedule" />} />
            <Route path="/supervisor/students" element={<PlaceholderPage title="Assigned Students" />} />
            <Route path="/supervisor/settings" element={<PlaceholderPage title="Supervisor Settings" />} />
          </Route>
        </Route>

        {/* Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
