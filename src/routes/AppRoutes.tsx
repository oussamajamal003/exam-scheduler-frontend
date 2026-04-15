import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { StudentsPage } from '@/pages/admin/StudentsPage';
import { NotFound } from '@/pages/NotFound';
import { AuthGuard, RoleGuard } from '@/guards/authguard';

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
            <Route path="/exams" element={<div className="p-4">Exams Management</div>} />
            <Route path="/rooms" element={<div className="p-4">Rooms Management</div>} />
            <Route path="/supervisors" element={<div className="p-4">Supervisors Management</div>} />
            <Route path="/schedule" element={<div className="p-4">Schedule Generation</div>} />
            <Route path="/conflicts" element={<div className="p-4">Conflicts Detection</div>} />
            <Route path="/settings" element={<div className="p-4">System Settings</div>} />
          </Route>
        </Route>

        {/* Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
