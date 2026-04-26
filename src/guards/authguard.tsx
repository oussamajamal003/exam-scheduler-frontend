import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getHomePathForRole, normalizeRole } from '@/lib/authRoutes';

const isSessionValid = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  const expiresAt = localStorage.getItem('token_expires_at');
  if (expiresAt && Date.now() > Number(expiresAt)) {
    localStorage.removeItem('token');
    localStorage.removeItem('token_expires_at');
    localStorage.removeItem('auth_user');
    return false;
  }
  return true;
};

interface AuthGuardProps {
  children?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const valid = isSessionValid();
  const location = useLocation();

  if (!valid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

interface RoleGuardProps {
  allowedRoles: readonly string[];
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
  const valid = isSessionValid();
  const location = useLocation();
  const token = valid ? localStorage.getItem('token') : null;
  const role = normalizeRole(decodeTokenRole(token));

  if (!valid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={getHomePathForRole(role)} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

/**
 * Used on auth pages (login). Redirects authenticated users to their role home,
 * preventing logged-in users from seeing /login again.
 */
interface GuestGuardProps {
  children?: React.ReactNode;
}

export const GuestGuard: React.FC<GuestGuardProps> = ({ children }) => {
  const valid = isSessionValid();
  const token = valid ? localStorage.getItem('token') : null;
  const role = normalizeRole(decodeTokenRole(token));

  if (valid && role) {
    return <Navigate to={getHomePathForRole(role)} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

