import DashboardLayout from '../dashboard/DashboardLayout';

// Academy items are placeholders until that module is built.
const STUDENT_NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/student', label: 'Dashboard', end: true },
      { to: '/student/notifications', label: 'Notifications' },
    ],
  },
  {
    label: 'Academy',
    items: [
      { to: '/student/courses', label: 'My Courses', disabled: true },
      { to: '/student/assignments', label: 'Assignments', disabled: true },
      { to: '/student/certificates', label: 'Certificates', disabled: true },
    ],
  },
];

export default function StudentLayout() {
  return <DashboardLayout navGroups={STUDENT_NAV_GROUPS} brandLabel="KayTech Student" notificationsBasePath="/student" />;
}
