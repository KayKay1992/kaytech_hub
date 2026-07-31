import { Award, Bell, BookOpen, ClipboardCheck, LayoutDashboard } from 'lucide-react';
import DashboardLayout from '../dashboard/DashboardLayout';

const STUDENT_NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { to: '/student', label: 'Dashboard', end: true, icon: LayoutDashboard },
      { to: '/student/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'Academy',
    items: [
      { to: '/student/courses', label: 'My Courses', icon: BookOpen },
      { to: '/student/assignments', label: 'Assignments', icon: ClipboardCheck },
      { to: '/student/certificates', label: 'Certificates', icon: Award },
    ],
  },
];

export default function StudentLayout() {
  return <DashboardLayout navGroups={STUDENT_NAV_GROUPS} brandLabel="KayTech Student" notificationsBasePath="/student" />;
}
