export const ADMIN_ROLES = ['ADMIN'] as const;

export type AppRole = 'ADMIN' | 'STUDENT' | 'SUPERVISOR';

// Normalize role strings (including legacy admin variants) to the canonical UI set.
export const normalizeRole = (role?: string | null): AppRole | null => {
  if (!role) return null;
  switch (role) {
    case 'ADMIN':
    case 'TECH_ADMIN':
    case 'SCHEDULING_ADMIN':
      return 'ADMIN';
    case 'STUDENT':
      return 'STUDENT';
    case 'SUPERVISOR':
      return 'SUPERVISOR';
    default:
      return null;
  }
};

export const getHomePathForRole = (role?: string | null) => {
  switch (normalizeRole(role)) {
    case 'STUDENT':
      return '/student/dashboard';
    case 'SUPERVISOR':
      return '/supervisor/dashboard';
    case 'ADMIN':
      return '/dashboard';
    default:
      return '/login';
  }
};