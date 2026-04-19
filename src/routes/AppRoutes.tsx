import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { StudentsPage } from '@/pages/admin/StudentsPage';
import { AIOptimizerPage } from '@/pages/admin/AIOptimizerPage';
import { CoursesPage } from '@/pages/admin/CoursesPage';
import { SupervisorsPage } from '@/pages/admin/SupervisorsPage';
import { RoomsCentersPage } from '@/pages/admin/RoomsCentersPage';
import { NotFound } from '@/pages/NotFound';
import { PageSpinner } from '@/components/shared/PageSpinner';
import { AuthGuard, RoleGuard } from '@/guards/authguard';

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <PageSpinner label={`Loading ${title.toLowerCase()}`} />;
  }

  return <div className="p-4 text-zinc-950">{title}</div>;
};

export const AppRoutes: React.FC = () => {
  return ( 
    <BrowserRouter>
      <Routes>
        {/* Public / Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Admin/Dashboard Routes */}
        <Route element={<AuthGuard />}>
          <Route element={<AdminLayout />}>
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
            <Route path="/exams" element={<PlaceholderPage title="Exams Management" />} />
            <Route path="/rooms" element={<RoomsCentersPage />} />
            <Route path="/supervisors" element={<SupervisorsPage />} />
            <Route path="/schedule" element={<PlaceholderPage title="Schedule Generation" />} />
            <Route path="/conflicts" element={<PlaceholderPage title="Conflicts Detection" />} />
            <Route path="/settings" element={<PlaceholderPage title="System Settings" />} />
          </Route>
        </Route>

        {/* Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
