export const ADMIN_ROLES = ['TECH_ADMIN', 'SCHEDULING_ADMIN'] as const;

export const getHomePathForRole = (role?: string | null) => {
  switch (role) {
    case 'STUDENT':
      return '/student/dashboard';
    case 'SUPERVISOR':
      return '/supervisor/dashboard';
    case 'TECH_ADMIN':
    case 'SCHEDULING_ADMIN':
      return '/dashboard';
    default:
      return '/login';
  }
};