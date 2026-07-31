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
import CourseRegister from './pages/CourseRegister';
import Services from './pages/Services';
import Mentorship from './pages/Mentorship';
import Space from './pages/Space';
import Blog from './pages/Blog';
import Events from './pages/Events';
import Careers from './pages/Careers';
import JobDetail from './pages/JobDetail';
import Scholarships from './pages/Scholarships';
import ScholarshipDetail from './pages/ScholarshipDetail';
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
import AdminScholarships from './pages/admin/Scholarships';
import ScholarshipForm from './pages/admin/ScholarshipForm';
import AdminScholarshipApplications from './pages/admin/ScholarshipApplications';
import AdminNotifications from './pages/admin/Notifications';
import StudentDashboard from './pages/student/Dashboard';
import StudentNotifications from './pages/student/Notifications';
import StudentCourses from './pages/student/Courses';
import StudentCourseContent from './pages/student/CourseContent';
import StudentAssignments from './pages/student/Assignments';
import InstructorDashboard from './pages/instructor/Dashboard';
import InstructorNotifications from './pages/instructor/Notifications';
import AdminCourses from './pages/admin/academy/Courses';
import AdminCourseForm from './pages/admin/academy/CourseForm';
import AdminCourseContent from './pages/admin/academy/CourseContent';
import AdminCohorts from './pages/admin/academy/Cohorts';
import AdminCohortForm from './pages/admin/academy/CohortForm';
import AdminApprovals from './pages/admin/academy/Approvals';
import AdminRegistrations from './pages/admin/academy/Registrations';
import AdminCohortEnrollments from './pages/admin/academy/CohortEnrollments';
import AdminCohortAttendance from './pages/admin/academy/CohortAttendance';
import InstructorCourses from './pages/instructor/academy/Courses';
import InstructorCourseContent from './pages/instructor/academy/CourseContent';
import InstructorAssignments from './pages/instructor/academy/Assignments';
import InstructorAssignmentSubmissions from './pages/instructor/academy/AssignmentSubmissions';
import InstructorAttendance from './pages/instructor/academy/Attendance';

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/courses/:id/register" element={<CourseRegister />} />
        <Route path="/services" element={<Services />} />
        <Route path="/mentorship" element={<Mentorship />} />
        <Route path="/space" element={<Space />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/events" element={<Events />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/careers/:id" element={<JobDetail />} />
        <Route path="/scholarships" element={<Scholarships />} />
        <Route path="/scholarships/:id" element={<ScholarshipDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<ProtectedRoute roles={['student']} />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="notifications" element={<StudentNotifications />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="courses/:cohortId" element={<StudentCourseContent />} />
          <Route path="assignments" element={<StudentAssignments />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['instructor']} />}>
        <Route path="/instructor" element={<InstructorLayout />}>
          <Route index element={<InstructorDashboard />} />
          <Route path="notifications" element={<InstructorNotifications />} />
          <Route path="academy/courses" element={<InstructorCourses />} />
          <Route path="academy/courses/:courseId" element={<InstructorCourseContent />} />
          <Route path="academy/assignments" element={<InstructorAssignments />} />
          <Route path="academy/assignments/:assignmentId/submissions" element={<InstructorAssignmentSubmissions />} />
          <Route path="academy/attendance" element={<InstructorAttendance />} />
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
          <Route path="scholarships" element={<AdminScholarships />} />
          <Route path="scholarships/new" element={<ScholarshipForm />} />
          <Route path="scholarships/:id/edit" element={<ScholarshipForm />} />
          <Route path="scholarships/:id/applications" element={<AdminScholarshipApplications />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="academy/courses" element={<AdminCourses />} />
          <Route path="academy/courses/new" element={<AdminCourseForm />} />
          <Route path="academy/courses/:id/edit" element={<AdminCourseForm />} />
          <Route path="academy/courses/:id/content" element={<AdminCourseContent />} />
          <Route path="academy/cohorts" element={<AdminCohorts />} />
          <Route path="academy/cohorts/new" element={<AdminCohortForm />} />
          <Route path="academy/cohorts/:id/edit" element={<AdminCohortForm />} />
          <Route path="academy/cohorts/:id/enrollments" element={<AdminCohortEnrollments />} />
          <Route path="academy/cohorts/:id/attendance" element={<AdminCohortAttendance />} />
          <Route path="academy/approvals" element={<AdminApprovals />} />
          <Route path="academy/registrations" element={<AdminRegistrations />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
