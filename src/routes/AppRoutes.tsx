import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import StudentLayout from '@/layouts/StudentLayout';
import SupervisorLayout from '@/layouts/SupervisorLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
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
import { NotFound } from '@/pages/NotFound';
import { PageSpinner } from '@/components/shared/PageSpinner';
import { AuthGuard, RoleGuard } from '@/guards/authguard';
import { ADMIN_ROLES } from '@/lib/authRoutes';

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

export const AppRoutes: React.FC = () => {
  return ( 
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public / Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Admin/Dashboard Routes */}
        <Route element={<AuthGuard />}>
          <Route
            element={
              <RoleGuard allowedRoles={[...ADMIN_ROLES]}>
                <AdminLayout />
              </RoleGuard>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
          
            {/* Implemented Feature Route */}
            <Route
              path="/students"
              element={
                <RoleGuard allowedRoles={['TECH_ADMIN', 'SCHEDULING_ADMIN']}>
                  <StudentsPage />
                </RoleGuard>
              }
            />

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
            <Route path="/schedule" element={<PlaceholderPage title="Schedule Generation" />} />
            <Route path="/scheduling" element={<PlaceholderPage title="Schedule Generation" />} />
            <Route path="/conflicts" element={<PlaceholderPage title="Conflicts Detection" />} />
            <Route path="/settings" element={<PlaceholderPage title="System Settings" />} />
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
