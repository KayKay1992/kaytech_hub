import DashboardLayout from '../dashboard/DashboardLayout';

// Students list is a placeholder until that module is built.
const INSTRUCTOR_NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/instructor', label: 'Dashboard', end: true },
      { to: '/instructor/notifications', label: 'Notifications' },
    ],
  },
  {
    label: 'Academy',
    items: [
      { to: '/instructor/academy/courses', label: 'My Courses' },
      { to: '/instructor/academy/assignments', label: 'Assignments' },
      { to: '/instructor/students', label: 'Students', disabled: true },
    ],
  },
];

export default function InstructorLayout() {
  return <DashboardLayout navGroups={INSTRUCTOR_NAV_GROUPS} brandLabel="KayTech Instructor" notificationsBasePath="/instructor" />;
}
