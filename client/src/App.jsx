import { Routes, Route } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import StudentLayout from './components/student/StudentLayout';
import InstructorLayout from './components/instructor/InstructorLayout';

import Home from './pages/Home';
import About from './pages/About';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Services from './pages/Services';
import Mentorship from './pages/Mentorship';
import Space from './pages/Space';
import Blog from './pages/Blog';
import Events from './pages/Events';
import Careers from './pages/Careers';
import JobDetail from './pages/JobDetail';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Dashboard from './pages/admin/Dashboard';
import Invites from './pages/admin/Invites';
import Users from './pages/admin/Users';
import Jobs from './pages/admin/Jobs';
import JobForm from './pages/admin/JobForm';
import JobApplications from './pages/admin/JobApplications';
import AdminNotifications from './pages/admin/Notifications';
import StudentDashboard from './pages/student/Dashboard';
import StudentNotifications from './pages/student/Notifications';
import InstructorDashboard from './pages/instructor/Dashboard';
import InstructorNotifications from './pages/instructor/Notifications';

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:slug" element={<CourseDetail />} />
        <Route path="/services" element={<Services />} />
        <Route path="/mentorship" element={<Mentorship />} />
        <Route path="/space" element={<Space />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/events" element={<Events />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/careers/:id" element={<JobDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<ProtectedRoute roles={['student']} />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="notifications" element={<StudentNotifications />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['instructor']} />}>
        <Route path="/instructor" element={<InstructorLayout />}>
          <Route index element={<InstructorDashboard />} />
          <Route path="notifications" element={<InstructorNotifications />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="invites" element={<Invites />} />
          <Route path="users" element={<Users />} />
          <Route path="careers" element={<Jobs />} />
          <Route path="careers/new" element={<JobForm />} />
          <Route path="careers/:id/edit" element={<JobForm />} />
          <Route path="careers/:id/applications" element={<JobApplications />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
