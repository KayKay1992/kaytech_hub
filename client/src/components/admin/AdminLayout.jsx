import {
  Award,
  Bell,
  Boxes,
  Briefcase,
  Building2,
  CheckSquare,
  ClipboardList,
  CreditCard,
  Globe,
  KeyRound,
  LayoutDashboard,
  BookOpen,
  Users2,
  UsersRound,
  Wallet,
} from 'lucide-react';
import DashboardLayout from '../dashboard/DashboardLayout';

const ADMIN_NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { to: '/admin', label: 'Dashboard', end: true, icon: LayoutDashboard },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'Academy',
    items: [
      { to: '/admin/academy/courses', label: 'Courses', icon: BookOpen },
      { to: '/admin/academy/cohorts', label: 'Cohorts', icon: Users2 },
      { to: '/admin/academy/approvals', label: 'Approvals', icon: CheckSquare },
      { to: '/admin/academy/registrations', label: 'Registrations', icon: ClipboardList },
      { to: '/admin/academy/payments', label: 'Payments', icon: CreditCard },
      { to: '/admin/academy/payouts', label: 'Payouts', icon: Wallet },
      { to: '/admin/scholarships', label: 'Scholarships', icon: Award },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/users', label: 'Users', icon: UsersRound },
      { to: '/admin/invites', label: 'Invite Codes', icon: KeyRound },
      { to: '/admin/careers', label: 'Job Listings', icon: Briefcase },
      { to: '/admin/hub', label: 'Services & Mentorship', icon: Boxes, disabled: true },
      { to: '/admin/space', label: 'Plans & Members', icon: Building2, disabled: true },
      { to: '/admin/site', label: 'Blog & Settings', icon: Globe, disabled: true },
    ],
  },
];

export default function AdminLayout() {
  return <DashboardLayout navGroups={ADMIN_NAV_GROUPS} brandLabel="KayTech Admin" />;
}
