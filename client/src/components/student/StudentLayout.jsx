import DashboardLayout from '../dashboard/DashboardLayout';

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
      { to: '/student/courses', label: 'My Courses' },
      { to: '/student/assignments', label: 'Assignments' },
      { to: '/student/certificates', label: 'Certificates' },
    ],
  },
];

export default function StudentLayout() {
  return <DashboardLayout navGroups={STUDENT_NAV_GROUPS} brandLabel="KayTech Student" notificationsBasePath="/student" />;
}
