import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import InstallPrompt from './components/common/InstallPrompt';
import PageLoader from './components/common/PageLoader';

// Every layout and page below is code-split via React.lazy() — a public
// visitor browsing Courses/Services should never download the Admin
// panel, Instructor/Student dashboards, AI Tutor, or Forums bundles. Each
// import() becomes its own chunk, fetched only when that route is hit.
const PublicLayout = lazy(() => import('./components/layout/PublicLayout'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const StudentLayout = lazy(() => import('./components/student/StudentLayout'));
const InstructorLayout = lazy(() => import('./components/instructor/InstructorLayout'));

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const CourseRegister = lazy(() => import('./pages/CourseRegister'));
const CourseWaitlistJoin = lazy(() => import('./pages/CourseWaitlistJoin'));
const Services = lazy(() => import('./pages/Services'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const ServiceRequest = lazy(() => import('./pages/ServiceRequest'));
const CorporateTrainingRequest = lazy(() => import('./pages/CorporateTrainingRequest'));
const Mentorship = lazy(() => import('./pages/Mentorship'));
const Space = lazy(() => import('./pages/Space'));
const SpaceReserve = lazy(() => import('./pages/SpaceReserve'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const Events = lazy(() => import('./pages/Events'));
const EventRegister = lazy(() => import('./pages/EventRegister'));
const Careers = lazy(() => import('./pages/Careers'));
const JobDetail = lazy(() => import('./pages/JobDetail'));
const Scholarships = lazy(() => import('./pages/Scholarships'));
const ScholarshipDetail = lazy(() => import('./pages/ScholarshipDetail'));
const MentorshipDetail = lazy(() => import('./pages/MentorshipDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const TestimonialSubmit = lazy(() => import('./pages/TestimonialSubmit'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const NotFound = lazy(() => import('./pages/NotFound'));

const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Invites = lazy(() => import('./pages/admin/Invites'));
const Users = lazy(() => import('./pages/admin/Users'));
const Jobs = lazy(() => import('./pages/admin/Jobs'));
const JobForm = lazy(() => import('./pages/admin/JobForm'));
const JobApplications = lazy(() => import('./pages/admin/JobApplications'));
const AdminScholarships = lazy(() => import('./pages/admin/Scholarships'));
const ScholarshipForm = lazy(() => import('./pages/admin/ScholarshipForm'));
const AdminScholarshipApplications = lazy(() => import('./pages/admin/ScholarshipApplications'));
const AdminNotifications = lazy(() => import('./pages/admin/Notifications'));
const AdminSuccessStories = lazy(() => import('./pages/admin/SuccessStories'));
const AdminCourseReviews = lazy(() => import('./pages/admin/CourseReviews'));
const AdminTestimonials = lazy(() => import('./pages/admin/Testimonials'));
const AdminBlogPosts = lazy(() => import('./pages/admin/BlogPosts'));
const BlogPostForm = lazy(() => import('./pages/admin/BlogPostForm'));
const AdminEvents = lazy(() => import('./pages/admin/Events'));
const EventRegistrants = lazy(() => import('./pages/admin/EventRegistrants'));
const AdminServices = lazy(() => import('./pages/admin/hub/Services'));
const AdminServiceForm = lazy(() => import('./pages/admin/hub/ServiceForm'));
const AdminServiceRequests = lazy(() => import('./pages/admin/hub/ServiceRequests'));
const AdminCorporateTraining = lazy(() => import('./pages/admin/hub/CorporateTraining'));
const AdminCorporateTrainingDetail = lazy(() => import('./pages/admin/hub/CorporateTrainingDetail'));
const AdminCorporateClients = lazy(() => import('./pages/admin/hub/CorporateClients'));
const AdminCorporateClientDetail = lazy(() => import('./pages/admin/hub/CorporateClientDetail'));
const AdminMentorship = lazy(() => import('./pages/admin/hub/Mentorship'));
const AdminMentorshipRegistrations = lazy(() => import('./pages/admin/hub/MentorshipRegistrations'));
const AdminSpacePlans = lazy(() => import('./pages/admin/space/Plans'));
const AdminSpaceSubscriptions = lazy(() => import('./pages/admin/space/Subscriptions'));
const AdminCourses = lazy(() => import('./pages/admin/academy/Courses'));
const AdminCourseContent = lazy(() => import('./pages/admin/academy/CourseContent'));
const AdminCohorts = lazy(() => import('./pages/admin/academy/Cohorts'));
const AdminCohortForm = lazy(() => import('./pages/admin/academy/CohortForm'));
const AdminWaitlist = lazy(() => import('./pages/admin/academy/Waitlist'));
const AdminApprovals = lazy(() => import('./pages/admin/academy/Approvals'));
const AdminRegistrations = lazy(() => import('./pages/admin/academy/Registrations'));
const AdminCohortEnrollments = lazy(() => import('./pages/admin/academy/CohortEnrollments'));
const AdminCohortAttendance = lazy(() => import('./pages/admin/academy/CohortAttendance'));
const AdminPayments = lazy(() => import('./pages/admin/academy/Payments'));
const AdminPayouts = lazy(() => import('./pages/admin/academy/Payouts'));
const AdminForums = lazy(() => import('./pages/admin/Forums'));
const AdminForumPost = lazy(() => import('./pages/admin/ForumPost'));
const AdminAlumniDirectory = lazy(() => import('./pages/admin/AlumniDirectory'));
const AdminJobBoard = lazy(() => import('./pages/admin/JobBoard'));
const AdminForumModeration = lazy(() => import('./pages/admin/ForumModeration'));
const AdminGraduateJobs = lazy(() => import('./pages/admin/GraduateJobs'));

const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentNotifications = lazy(() => import('./pages/student/Notifications'));
const StudentCourses = lazy(() => import('./pages/student/Courses'));
const StudentCourseContent = lazy(() => import('./pages/student/CourseContent'));
const StudentAssignments = lazy(() => import('./pages/student/Assignments'));
const StudentCertificates = lazy(() => import('./pages/student/Certificates'));
const StudentSuccessStoryForm = lazy(() => import('./pages/student/SuccessStoryForm'));
const StudentCourseReviewForm = lazy(() => import('./pages/student/CourseReviewForm'));
const StudentForums = lazy(() => import('./pages/student/Forums'));
const StudentForumPost = lazy(() => import('./pages/student/ForumPost'));
const StudentAlumniDirectory = lazy(() => import('./pages/student/AlumniDirectory'));
const StudentJobBoard = lazy(() => import('./pages/student/JobBoard'));
const StudentAssistant = lazy(() => import('./pages/student/Assistant'));

const InstructorDashboard = lazy(() => import('./pages/instructor/Dashboard'));
const InstructorNotifications = lazy(() => import('./pages/instructor/Notifications'));
const InstructorForums = lazy(() => import('./pages/instructor/Forums'));
const InstructorForumPost = lazy(() => import('./pages/instructor/ForumPost'));
const InstructorAlumniDirectory = lazy(() => import('./pages/instructor/AlumniDirectory'));
const InstructorJobBoard = lazy(() => import('./pages/instructor/JobBoard'));
const InstructorAssistant = lazy(() => import('./pages/instructor/Assistant'));
const InstructorCourses = lazy(() => import('./pages/instructor/academy/Courses'));
const InstructorCourseContent = lazy(() => import('./pages/instructor/academy/CourseContent'));
const InstructorAssignments = lazy(() => import('./pages/instructor/academy/Assignments'));
const InstructorAssignmentSubmissions = lazy(() => import('./pages/instructor/academy/AssignmentSubmissions'));
const InstructorAttendance = lazy(() => import('./pages/instructor/academy/Attendance'));
const InstructorPayouts = lazy(() => import('./pages/instructor/academy/Payouts'));

function App() {
  return (
    <>
      <InstallPrompt />
      <Suspense fallback={<PageLoader fullScreen />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/courses/:id/register" element={<CourseRegister />} />
            <Route path="/courses/:id/waitlist" element={<CourseWaitlistJoin />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/services/:id/request" element={<ServiceRequest />} />
            <Route path="/corporate-training" element={<CorporateTrainingRequest />} />
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
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
              <Route path="reviews/new" element={<StudentCourseReviewForm />} />
              <Route path="forums/:forumType" element={<StudentForums />} />
              <Route path="forums/:forumType/:postId" element={<StudentForumPost />} />
              <Route path="alumni-directory" element={<StudentAlumniDirectory />} />
              <Route path="job-board" element={<StudentJobBoard />} />
              <Route path="assistant" element={<StudentAssistant />} />
              <Route path="profile" element={<Profile />} />
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
              <Route path="forums/:forumType" element={<InstructorForums />} />
              <Route path="forums/:forumType/:postId" element={<InstructorForumPost />} />
              <Route path="alumni-directory" element={<InstructorAlumniDirectory />} />
              <Route path="job-board" element={<InstructorJobBoard />} />
              <Route path="assistant" element={<InstructorAssistant />} />
              <Route path="profile" element={<Profile />} />
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
              <Route path="course-reviews" element={<AdminCourseReviews />} />
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
              <Route path="corporate-training" element={<AdminCorporateTraining />} />
              <Route path="corporate-training/:id" element={<AdminCorporateTrainingDetail />} />
              <Route path="corporate-clients" element={<AdminCorporateClients />} />
              <Route path="corporate-clients/:id" element={<AdminCorporateClientDetail />} />
              <Route path="mentorship" element={<AdminMentorship />} />
              <Route path="mentorship-registrations" element={<AdminMentorshipRegistrations />} />
              <Route path="space/plans" element={<AdminSpacePlans />} />
              <Route path="space/subscriptions" element={<AdminSpaceSubscriptions />} />
              <Route path="academy/courses" element={<AdminCourses />} />
              <Route path="academy/courses/:id/content" element={<AdminCourseContent />} />
              <Route path="academy/cohorts" element={<AdminCohorts />} />
              <Route path="academy/cohorts/new" element={<AdminCohortForm />} />
              <Route path="academy/cohorts/:id/edit" element={<AdminCohortForm />} />
              <Route path="academy/waitlist" element={<AdminWaitlist />} />
              <Route path="academy/cohorts/:id/enrollments" element={<AdminCohortEnrollments />} />
              <Route path="academy/cohorts/:id/attendance" element={<AdminCohortAttendance />} />
              <Route path="academy/approvals" element={<AdminApprovals />} />
              <Route path="academy/registrations" element={<AdminRegistrations />} />
              <Route path="academy/payments" element={<AdminPayments />} />
              <Route path="academy/payouts" element={<AdminPayouts />} />
              <Route path="forums/:forumType" element={<AdminForums />} />
              <Route path="forums/:forumType/:postId" element={<AdminForumPost />} />
              <Route path="alumni-directory" element={<AdminAlumniDirectory />} />
              <Route path="job-board" element={<AdminJobBoard />} />
              <Route path="graduate-jobs" element={<AdminGraduateJobs />} />
              <Route path="forum-moderation" element={<AdminForumModeration />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
