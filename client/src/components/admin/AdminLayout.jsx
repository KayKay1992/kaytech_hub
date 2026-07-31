import DashboardLayout from '../dashboard/DashboardLayout';

// Sections below map to future modules. Each will get its own routes/pages
// as that module is built — this sidebar is the plug-in point for all of them.
const ADMIN_NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', end: true },
      { to: '/admin/users', label: 'Users' },
      { to: '/admin/invites', label: 'Invite Codes' },
      { to: '/admin/notifications', label: 'Notifications' },
    ],
  },
  {
    label: 'Careers',
    items: [{ to: '/admin/careers', label: 'Job Listings' }],
  },
  {
    label: 'Scholarships',
    items: [{ to: '/admin/scholarships', label: 'Programs' }],
  },
  {
    label: 'Academy',
    items: [
      { to: '/admin/academy/courses', label: 'Courses' },
      { to: '/admin/academy/cohorts', label: 'Cohorts' },
      { to: '/admin/academy/approvals', label: 'Approvals' },
      { to: '/admin/academy/registrations', label: 'Registrations' },
      { to: '/admin/academy/payments', label: 'Payments' },
    ],
  },
  {
    label: 'Hub',
    items: [{ to: '/admin/hub', label: 'Services & Mentorship', disabled: true }],
  },
  {
    label: 'Space',
    items: [{ to: '/admin/space', label: 'Plans & Members', disabled: true }],
  },
  {
    label: 'Site',
    items: [{ to: '/admin/site', label: 'Blog & Settings', disabled: true }],
  },
];

export default function AdminLayout() {
  return <DashboardLayout navGroups={ADMIN_NAV_GROUPS} brandLabel="KayTech Admin" />;
}
