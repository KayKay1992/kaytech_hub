import { Bell, BookOpen, CalendarCheck, ClipboardCheck, LayoutDashboard, UsersRound, Wallet } from 'lucide-react';
import DashboardLayout from '../dashboard/DashboardLayout';

// Students list is a placeholder until that module is built.
const INSTRUCTOR_NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { to: '/instructor', label: 'Dashboard', end: true, icon: LayoutDashboard },
      { to: '/instructor/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'Academy',
    items: [
      { to: '/instructor/academy/courses', label: 'My Courses', icon: BookOpen },
      { to: '/instructor/academy/assignments', label: 'Assignments', icon: ClipboardCheck },
      { to: '/instructor/academy/attendance', label: 'Attendance', icon: CalendarCheck },
      { to: '/instructor/academy/payouts', label: 'Payouts', icon: Wallet },
      { to: '/instructor/students', label: 'Students', icon: UsersRound, disabled: true },
    ],
  },
];

export default function InstructorLayout() {
  return <DashboardLayout navGroups={INSTRUCTOR_NAV_GROUPS} brandLabel="KayTech Instructor" notificationsBasePath="/instructor" />;
}
