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
import ServiceDetail from './pages/ServiceDetail';
import ServiceRequest from './pages/ServiceRequest';
import Mentorship from './pages/Mentorship';
import Space from './pages/Space';
import SpaceReserve from './pages/SpaceReserve';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import Events from './pages/Events';
import EventRegister from './pages/EventRegister';
import Careers from './pages/Careers';
import JobDetail from './pages/JobDetail';
import Scholarships from './pages/Scholarships';
import ScholarshipDetail from './pages/ScholarshipDetail';
import MentorshipDetail from './pages/MentorshipDetail';
import Contact from './pages/Contact';
import TestimonialSubmit from './pages/TestimonialSubmit';
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
import AdminSuccessStories from './pages/admin/SuccessStories';
import AdminTestimonials from './pages/admin/Testimonials';
import AdminBlogPosts from './pages/admin/BlogPosts';
import BlogPostForm from './pages/admin/BlogPostForm';
import AdminEvents from './pages/admin/Events';
import EventRegistrants from './pages/admin/EventRegistrants';
import AdminServices from './pages/admin/hub/Services';
import AdminServiceForm from './pages/admin/hub/ServiceForm';
import AdminServiceRequests from './pages/admin/hub/ServiceRequests';
import AdminMentorship from './pages/admin/hub/Mentorship';
import AdminMentorshipRegistrations from './pages/admin/hub/MentorshipRegistrations';
import AdminSpacePlans from './pages/admin/space/Plans';
import AdminSpaceSubscriptions from './pages/admin/space/Subscriptions';
import StudentDashboard from './pages/student/Dashboard';
import StudentNotifications from './pages/student/Notifications';
import StudentCourses from './pages/student/Courses';
import StudentCourseContent from './pages/student/CourseContent';
import StudentAssignments from './pages/student/Assignments';
import StudentCertificates from './pages/student/Certificates';
import StudentSuccessStoryForm from './pages/student/SuccessStoryForm';
import InstructorDashboard from './pages/instructor/Dashboard';
import InstructorNotifications from './pages/instructor/Notifications';
import AdminCourses from './pages/admin/academy/Courses';
import AdminCourseContent from './pages/admin/academy/CourseContent';
import AdminCohorts from './pages/admin/academy/Cohorts';
import AdminCohortForm from './pages/admin/academy/CohortForm';
import AdminApprovals from './pages/admin/academy/Approvals';
import AdminRegistrations from './pages/admin/academy/Registrations';
import AdminCohortEnrollments from './pages/admin/academy/CohortEnrollments';
import AdminCohortAttendance from './pages/admin/academy/CohortAttendance';
import AdminPayments from './pages/admin/academy/Payments';
import AdminPayouts from './pages/admin/academy/Payouts';
import InstructorCourses from './pages/instructor/academy/Courses';
import InstructorCourseContent from './pages/instructor/academy/CourseContent';
import InstructorAssignments from './pages/instructor/academy/Assignments';
import InstructorAssignmentSubmissions from './pages/instructor/academy/AssignmentSubmissions';
import InstructorAttendance from './pages/instructor/academy/Attendance';
import InstructorPayouts from './pages/instructor/academy/Payouts';

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
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/services/:id/request" element={<ServiceRequest />} />
        <Route path="/mentorship" element={<Mentorship />} />
        <Route path="/space" element={<Space />} />
        <Route path="/space/:planId/reserve" element={<SpaceReserve />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId/register" element={<EventRegister />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/careers/:id" element={<JobDetail />} />
        <Route path="/scholarships" element={<Scholarships />} />
        <Route path="/scholarships/:id" element={<ScholarshipDetail />} />
        <Route path="/mentorship/:id" element={<MentorshipDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/testimonials/submit" element={<TestimonialSubmit />} />
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
          <Route path="certificates" element={<StudentCertificates />} />
          <Route path="success-story" element={<StudentSuccessStoryForm />} />
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
          <Route path="academy/payouts" element={<InstructorPayouts />} />
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
          <Route path="success-stories" element={<AdminSuccessStories />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="blog" element={<AdminBlogPosts />} />
          <Route path="blog/new" element={<BlogPostForm />} />
          <Route path="blog/:id/edit" element={<BlogPostForm />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="events/:eventId/registrants" element={<EventRegistrants />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="services/new" element={<AdminServiceForm />} />
          <Route path="services/:id/edit" element={<AdminServiceForm />} />
          <Route path="service-requests" element={<AdminServiceRequests />} />
          <Route path="mentorship" element={<AdminMentorship />} />
          <Route path="mentorship-registrations" element={<AdminMentorshipRegistrations />} />
          <Route path="space/plans" element={<AdminSpacePlans />} />
          <Route path="space/subscriptions" element={<AdminSpaceSubscriptions />} />
          <Route path="academy/courses" element={<AdminCourses />} />
          <Route path="academy/courses/:id/content" element={<AdminCourseContent />} />
          <Route path="academy/cohorts" element={<AdminCohorts />} />
          <Route path="academy/cohorts/new" element={<AdminCohortForm />} />
          <Route path="academy/cohorts/:id/edit" element={<AdminCohortForm />} />
          <Route path="academy/cohorts/:id/enrollments" element={<AdminCohortEnrollments />} />
          <Route path="academy/cohorts/:id/attendance" element={<AdminCohortAttendance />} />
          <Route path="academy/approvals" element={<AdminApprovals />} />
          <Route path="academy/registrations" element={<AdminRegistrations />} />
          <Route path="academy/payments" element={<AdminPayments />} />
          <Route path="academy/payouts" element={<AdminPayouts />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
