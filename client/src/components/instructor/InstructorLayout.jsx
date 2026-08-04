import { Bell, BookOpen, CalendarCheck, ClipboardCheck, LayoutDashboard, MessagesSquare, Sparkles, UsersRound, Wallet } from 'lucide-react';
import DashboardLayout from '../dashboard/DashboardLayout';

// Students list is a placeholder until that module is built.
const INSTRUCTOR_NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { to: '/instructor', label: 'Dashboard', end: true, icon: LayoutDashboard },
      { to: '/instructor/notifications', label: 'Notifications', icon: Bell },
      { to: '/instructor/assistant', label: 'AI Lesson Assistant', icon: Sparkles },
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
  {
    label: 'Community',
    items: [
      { to: '/instructor/forums/student', label: 'Student Forum', icon: MessagesSquare },
      { to: '/instructor/forums/alumni', label: 'Alumni Forum', icon: MessagesSquare },
    ],
  },
];

export default function InstructorLayout() {
  return <DashboardLayout navGroups={INSTRUCTOR_NAV_GROUPS} brandLabel="KayTech Instructor" notificationsBasePath="/instructor" />;
}
