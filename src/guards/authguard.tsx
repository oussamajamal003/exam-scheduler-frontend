import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getHomePathForRole, normalizeRole } from '@/lib/authRoutes';
import { authStorageKeys, clearStoredAuthSession } from '@/api/axiosclient';

const AUTH_GUARD_CHECKED_BOOT_SESSION_KEY = 'auth_guard_checked_boot';
const AUTH_GUARD_LAST_PATH_SESSION_KEY = 'auth_guard_last_path';

const isSessionValid = (pathname: string): boolean => {
  const token = localStorage.getItem(authStorageKeys.token);
  if (!token) return false;

  const currentBootId = sessionStorage.getItem(authStorageKeys.pageBootId);
  const checkedBootId = sessionStorage.getItem(AUTH_GUARD_CHECKED_BOOT_SESSION_KEY);
  const lastPath = sessionStorage.getItem(AUTH_GUARD_LAST_PATH_SESSION_KEY);
  const expiresAt = localStorage.getItem(authStorageKeys.tokenExpiresAt);
  const expired = expiresAt ? Date.now() > Number(expiresAt) : false;

  if (currentBootId && checkedBootId !== currentBootId) {
    sessionStorage.setItem(AUTH_GUARD_CHECKED_BOOT_SESSION_KEY, currentBootId);

    const forceLogoutOnReload =
      localStorage.getItem(authStorageKeys.forceLogoutOnReload) === 'true';
    const forceLogoutBootId = localStorage.getItem(authStorageKeys.forceLogoutOnReloadBoot);
    const shouldLogoutAfterReload =
      forceLogoutOnReload && forceLogoutBootId !== currentBootId;

    if (shouldLogoutAfterReload || expired) {
      clearStoredAuthSession();
      return false;
    }
  }

  if (expired && lastPath && lastPath !== pathname) {
    clearStoredAuthSession();
    sessionStorage.removeItem(AUTH_GUARD_LAST_PATH_SESSION_KEY);
    return false;
  }

  sessionStorage.setItem(AUTH_GUARD_LAST_PATH_SESSION_KEY, pathname);

  return true;
};

interface AuthGuardProps {
  children?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const location = useLocation();
  const valid = isSessionValid(location.pathname);

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
  const location = useLocation();
  const valid = isSessionValid(location.pathname);
  const token = valid ? localStorage.getItem(authStorageKeys.token) : null;
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
  const location = useLocation();
  const valid = isSessionValid(location.pathname);
  const token = valid ? localStorage.getItem(authStorageKeys.token) : null;
  const role = normalizeRole(decodeTokenRole(token));

  if (valid && role) {
    return <Navigate to={getHomePathForRole(role)} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

