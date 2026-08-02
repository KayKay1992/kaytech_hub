import {
  Award,
  Bell,
  Boxes,
  Briefcase,
  Building2,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Globe,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  BookOpen,
  MessageSquareQuote,
  Star,
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
      { to: '/admin/success-stories', label: 'Success Stories', icon: Star },
    ],
  },
  {
    label: 'Hub',
    items: [
      { to: '/admin/services', label: 'Services', icon: Boxes },
      { to: '/admin/service-requests', label: 'Service Requests', icon: ClipboardList },
      { to: '/admin/mentorship', label: 'Mentorship', icon: GraduationCap },
      { to: '/admin/mentorship-registrations', label: 'Mentorship Registrations', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Space',
    items: [
      { to: '/admin/space/plans', label: 'Plans', icon: Building2 },
      { to: '/admin/space/subscriptions', label: 'Subscriptions', icon: ClipboardList },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/users', label: 'Users', icon: UsersRound },
      { to: '/admin/invites', label: 'Invite Codes', icon: KeyRound },
      { to: '/admin/careers', label: 'Job Listings', icon: Briefcase },
      { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
      { to: '/admin/site', label: 'Blog & Settings', icon: Globe, disabled: true },
    ],
  },
];

export default function AdminLayout() {
  return <DashboardLayout navGroups={ADMIN_NAV_GROUPS} brandLabel="KayTech Admin" />;
}
