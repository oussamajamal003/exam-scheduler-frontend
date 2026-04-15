import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

interface AuthGuardProps {
  children?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

interface RoleGuardProps {
  allowedRoles: string[];
  children?: React.ReactNode;
}

const decodeTokenRole = (token: string | null): string | null => {
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

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const role = decodeTokenRole(token);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
