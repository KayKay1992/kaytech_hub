import { useEffect, useState } from 'react';
import { Award, Bell, BookOpen, ClipboardCheck, LayoutDashboard, MessagesSquare } from 'lucide-react';
import DashboardLayout from '../dashboard/DashboardLayout';
import api from '../../api/axios';

const BASE_NAV_GROUPS = [
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

// Forum links are only shown once we know the student actually qualifies —
// membership is computed live server-side (Enrollment/Certificate state can
// change at any time), never assumed or cached here.
export default function StudentLayout() {
  const [access, setAccess] = useState(null);

  useEffect(() => {
    api.get('/forums/access')
      .then((res) => setAccess(res.data))
      .catch(() => setAccess(null));
  }, []);

  const communityItems = [];
  if (access?.student?.allowed) {
    communityItems.push({ to: '/student/forums/student', label: 'Student Forum', icon: MessagesSquare });
  }
  if (access?.alumni?.allowed) {
    communityItems.push({ to: '/student/forums/alumni', label: 'Alumni Forum', icon: MessagesSquare });
  }

  const navGroups = communityItems.length > 0
    ? [...BASE_NAV_GROUPS, { label: 'Community', items: communityItems }]
    : BASE_NAV_GROUPS;

  return <DashboardLayout navGroups={navGroups} brandLabel="KayTech Student" notificationsBasePath="/student" />;
}
