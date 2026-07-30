// Single source of truth for "where does this role land after login" —
// used by Login.jsx (post-login redirect) and Header.jsx (dashboard link).
const DASHBOARD_PATHS = {
  admin: '/admin',
  instructor: '/instructor',
  student: '/student',
};

export const getDashboardPath = (role) => DASHBOARD_PATHS[role] || '/';
