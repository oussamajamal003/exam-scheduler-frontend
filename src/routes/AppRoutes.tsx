import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import StudentLayout from '@/layouts/StudentLayout';
import ProctorLayout from '@/layouts/ProctorLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { NotFound } from '@/pages/NotFound';
import { PageSpinner } from '@/components/shared/PageSpinner';
import { AuthGuard, RoleGuard, GuestGuard } from '@/guards/authguard';
import { ADMIN_ROLES, getHomePathForRole, normalizeRole } from '@/lib/authRoutes';

// Code-split heavy admin & role pages so the first paint downloads only
// the dashboard + the login/auth chunks.
const StudentsPage = React.lazy(() => import('@/pages/admin/StudentsPage').then(m => ({ default: m.StudentsPage })));
const CoursesPage = React.lazy(() => import('../pages/admin/CoursesPage').then(m => ({ default: m.CoursesPage })));
const ProctorsPage = React.lazy(() => import('@/pages/admin/ProctorsPage').then(m => ({ default: m.ProctorsPage })));
const RoomsCentersPage = React.lazy(() => import('../pages/admin/RoomsCentersPage').then(m => ({ default: m.RoomsCentersPage })));
const CentersPage = React.lazy(() => import('../pages/admin/CentersPage').then(m => ({ default: m.CentersPage })));
const TimeSlotsPage = React.lazy(() => import('../pages/admin/TimeSlotsPage').then(m => ({ default: m.TimeSlotsPage })));
const DepartmentsPage = React.lazy(() => import('@/pages/admin/DepartmentsPage').then(m => ({ default: m.DepartmentsPage })));
const CourseOfferingsPage = React.lazy(() => import('@/pages/admin/CourseOfferingsPage').then(m => ({ default: m.CourseOfferingsPage })));
const CourseOfferingDetailPage = React.lazy(() => import('@/pages/admin/CourseOfferingDetailPage').then(m => ({ default: m.CourseOfferingDetailPage })));
const EnrollmentsPage = React.lazy(() => import('@/pages/admin/EnrollmentsPage').then(m => ({ default: m.EnrollmentsPage })));
const SemestersPage = React.lazy(() => import('@/pages/admin/SemestersPage').then(m => ({ default: m.SemestersPage })));
const SchedulesPage = React.lazy(() => import('@/pages/admin/SchedulesPage').then(m => ({ default: m.SchedulesPage })));
const SettingsPage = React.lazy(() => import('@/pages/admin/SettingsPage').then(m => ({ default: m.SettingsPage })));
const StudentDashboardPage = React.lazy(() => import('@/pages/student/StudentDashboardPage').then(m => ({ default: m.StudentDashboardPage })));
const StudentSchedulePage = React.lazy(() => import('@/pages/student/StudentSchedulePage').then(m => ({ default: m.StudentSchedulePage })));
const StudentCoursesPage = React.lazy(() => import('@/pages/student/StudentCoursesPage').then(m => ({ default: m.StudentCoursesPage })));
const StudentSettingsPage = React.lazy(() => import('@/pages/student/StudentSettingsPage').then(m => ({ default: m.StudentSettingsPage })));
const ProctorDashboardPage = React.lazy(() => import('@/pages/supervisor/ProctorDashboardPage').then(m => ({ default: m.ProctorDashboardPage })));
const ProctorSchedulePage = React.lazy(() => import('@/pages/supervisor/ProctorSchedulePage').then(m => ({ default: m.ProctorSchedulePage })));
const ProctorStudentsPage = React.lazy(() => import('@/pages/supervisor/ProctorStudentsPage').then(m => ({ default: m.ProctorStudentsPage })));
const ProctorSettingsPage = React.lazy(() => import('@/pages/supervisor/ProctorSettingsPage').then(m => ({ default: m.ProctorSettingsPage })));

const LazyFallback = () => <PageSpinner label="Loading…" />;
const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LazyFallback />}>{children}</Suspense>
);

const SCROLL_POSITIONS_STORAGE_KEY = 'route-scroll-positions';

const getStoredScrollPositions = () => {
  try {
    const raw = sessionStorage.getItem(SCROLL_POSITIONS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
};

const setStoredScrollPositions = (positions: Record<string, number>) => {
  sessionStorage.setItem(SCROLL_POSITIONS_STORAGE_KEY, JSON.stringify(positions));
};

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
  const location = useLocation();
  const previousPathRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    const previousPath = previousPathRef.current;

    if (previousPath && previousPath !== currentPath) {
      const positions = getStoredScrollPositions();
      positions[previousPath] = window.scrollY;
      setStoredScrollPositions(positions);
    }

    previousPathRef.current = currentPath;

    const positions = getStoredScrollPositions();
    const savedPosition = positions[currentPath] ?? 0;

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: savedPosition, behavior: 'auto' });
    });
  }, [location.pathname, location.search, location.hash]);

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
            <Route path="/students" element={<Lazy><StudentsPage /></Lazy>} />

            {/* Placeholders for future modules */}
            <Route path="/courses" element={<Lazy><CoursesPage /></Lazy>} />
            <Route path="/departments" element={<Lazy><DepartmentsPage /></Lazy>} />
            <Route path="/semesters" element={<Lazy><SemestersPage /></Lazy>} />
            <Route path="/course-offerings" element={<Lazy><CourseOfferingsPage /></Lazy>} />
            <Route path="/course-offerings/:id" element={<Lazy><CourseOfferingDetailPage /></Lazy>} />
            <Route path="/enrollments" element={<Lazy><EnrollmentsPage /></Lazy>} />
            <Route path="/exams" element={<PlaceholderPage title="Exams Management" />} />
            <Route path="/rooms" element={<Lazy><RoomsCentersPage /></Lazy>} />
            <Route path="/centers" element={<Lazy><CentersPage /></Lazy>} />
            <Route path="/proctors" element={<Lazy><ProctorsPage /></Lazy>} />
            <Route path="/timeslots" element={<Lazy><TimeSlotsPage /></Lazy>} />
            <Route path="/schedule" element={<Lazy><SchedulesPage /></Lazy>} />
            <Route path="/schedules" element={<Lazy><SchedulesPage /></Lazy>} />
            <Route path="/scheduling" element={<Lazy><SchedulesPage /></Lazy>} />
            <Route path="/settings" element={<Lazy><SettingsPage /></Lazy>} />
          </Route>

          <Route
            element={
              <RoleGuard allowedRoles={['STUDENT']}>
                <StudentLayout />
              </RoleGuard>
            }
          >
            <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/student/dashboard" element={<Lazy><StudentDashboardPage /></Lazy>} />
            <Route path="/student/schedule" element={<Lazy><StudentSchedulePage /></Lazy>} />
            <Route path="/student/courses" element={<Lazy><StudentCoursesPage /></Lazy>} />
            <Route path="/student/notifications" element={<Navigate to="/student/dashboard#notifications" replace />} />
            <Route path="/student/settings" element={<Lazy><StudentSettingsPage /></Lazy>} />
          </Route>

          <Route
            element={
              <RoleGuard allowedRoles={['PROCTOR']}>
                <ProctorLayout />
              </RoleGuard>
            }
          >
            <Route path="/proctor" element={<Navigate to="/proctor/dashboard" replace />} />
            <Route path="/proctor/dashboard" element={<Lazy><ProctorDashboardPage /></Lazy>} />
            <Route path="/proctor/schedule" element={<Lazy><ProctorSchedulePage /></Lazy>} />
            <Route path="/proctor/students" element={<Lazy><ProctorStudentsPage /></Lazy>} />
            <Route path="/proctor/settings" element={<Lazy><ProctorSettingsPage /></Lazy>} />
          </Route>
        </Route>

        {/* Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
