import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Login } from '@/pages/auth/Login';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { NotFound } from '@/pages/NotFound';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Placeholders for future modules */}
          <Route path="/students" element={<div className="p-4">Students Management</div>} />
          <Route path="/exams" element={<div className="p-4">Exams Management</div>} />
          <Route path="/rooms" element={<div className="p-4">Rooms Management</div>} />
          <Route path="/supervisors" element={<div className="p-4">Supervisors Management</div>} />
          <Route path="/schedule" element={<div className="p-4">Schedule Generation</div>} />
          <Route path="/conflicts" element={<div className="p-4">Conflicts Detection</div>} />
          <Route path="/settings" element={<div className="p-4">System Settings</div>} />
        </Route>

        {/* Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
