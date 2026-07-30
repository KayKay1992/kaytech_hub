import DashboardLayout from '../dashboard/DashboardLayout';

// Academy items are placeholders until that module is built.
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
      { to: '/instructor/cohorts', label: 'My Cohorts', disabled: true },
      { to: '/instructor/students', label: 'Students', disabled: true },
      { to: '/instructor/grading', label: 'Grading', disabled: true },
    ],
  },
];

export default function InstructorLayout() {
  return <DashboardLayout navGroups={INSTRUCTOR_NAV_GROUPS} brandLabel="KayTech Instructor" notificationsBasePath="/instructor" />;
}
