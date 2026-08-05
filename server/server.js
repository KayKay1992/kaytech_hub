const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const connectDB = require('./config/db');
const { socialPreviewMiddleware } = require('./middleware/socialPreview');

const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const adminJobRoutes = require('./routes/adminJobRoutes');
const contactRoutes = require('./routes/contactRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminNotificationRoutes = require('./routes/adminNotificationRoutes');
const courseRoutes = require('./routes/courseRoutes');
const adminAcademyRoutes = require('./routes/adminAcademyRoutes');
const instructorAcademyRoutes = require('./routes/instructorAcademyRoutes');
const studentAcademyRoutes = require('./routes/studentAcademyRoutes');
const scholarshipRoutes = require('./routes/scholarshipRoutes');
const adminScholarshipRoutes = require('./routes/adminScholarshipRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const adminReportsRoutes = require('./routes/adminReportsRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const adminServiceRoutes = require('./routes/adminServiceRoutes');
const mentorshipRoutes = require('./routes/mentorshipRoutes');
const adminMentorshipRoutes = require('./routes/adminMentorshipRoutes');
const spaceRoutes = require('./routes/spaceRoutes');
const adminSpaceRoutes = require('./routes/adminSpaceRoutes');
const successStoryRoutes = require('./routes/successStoryRoutes');
const studentSuccessStoryRoutes = require('./routes/studentSuccessStoryRoutes');
const adminSuccessStoryRoutes = require('./routes/adminSuccessStoryRoutes');
const studentCourseReviewRoutes = require('./routes/studentCourseReviewRoutes');
const adminCourseReviewRoutes = require('./routes/adminCourseReviewRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const adminTestimonialRoutes = require('./routes/adminTestimonialRoutes');
const blogRoutes = require('./routes/blogRoutes');
const adminBlogRoutes = require('./routes/adminBlogRoutes');
const eventRoutes = require('./routes/eventRoutes');
const adminEventRoutes = require('./routes/adminEventRoutes');
const forumRoutes = require('./routes/forumRoutes');
const adminForumRoutes = require('./routes/adminForumRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const corporateTrainingRoutes = require('./routes/corporateTrainingRoutes');
const adminCorporateRoutes = require('./routes/adminCorporateRoutes');
const graduateJobRoutes = require('./routes/graduateJobRoutes');
const adminAuditLogRoutes = require('./routes/adminAuditLogRoutes');
const adminGraduateJobRoutes = require('./routes/adminGraduateJobRoutes');

const app = express();

connectDB();
require('./jobs/paymentReminderCron');

// Needed so express-rate-limit reads the real client IP (X-Forwarded-For)
// instead of the reverse proxy's IP once deployed (Render, Railway, etc.).
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminJobRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminNotificationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admin', adminAcademyRoutes);
app.use('/api/instructor', instructorAcademyRoutes);
app.use('/api/student', studentAcademyRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/admin', adminScholarshipRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/admin', adminReportsRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminServiceRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/admin', adminMentorshipRoutes);
app.use('/api/space', spaceRoutes);
app.use('/api/admin', adminSpaceRoutes);
app.use('/api/success-stories', successStoryRoutes);
app.use('/api/student', studentSuccessStoryRoutes);
app.use('/api/admin', adminSuccessStoryRoutes);
app.use('/api/student', studentCourseReviewRoutes);
app.use('/api/admin', adminCourseReviewRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/admin', adminTestimonialRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/admin', adminBlogRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminEventRoutes);
app.use('/api/forums', forumRoutes);
app.use('/api/admin', adminForumRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/corporate-training', corporateTrainingRoutes);
app.use('/api/admin', adminCorporateRoutes);
app.use('/api/graduate-jobs', graduateJobRoutes);
app.use('/api/admin', adminGraduateJobRoutes);
app.use('/api/admin', adminAuditLogRoutes);

// 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Social link-preview crawlers (Facebook, WhatsApp, Twitter/X, LinkedIn,
// etc.) don't execute JS, so react-helmet-async's per-page tags never
// reach them — this hands crawlers hitting a Course/Service/Blog post
// page a real per-page preview instead. Every other request (browsers,
// Googlebot) falls straight through unaffected.
app.use(socialPreviewMiddleware);

// Serve the built React app (single-server deployment: this same process
// serves both the API and the SPA). Only active once `client` has been
// built — local dev typically runs the Vite dev server separately instead,
// so this is skipped rather than erroring when client/dist doesn't exist.
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');
if (fs.existsSync(clientIndexPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => res.sendFile(clientIndexPath));
} else {
  console.log('client/dist not found — skipping static app serving (run `npm run build` in /client to enable it)');
}

// Central error handler (e.g. multer file-size/type errors)
app.use((err, req, res, next) => {
  console.error(err);
  const isClientUploadError = err instanceof multer.MulterError || /image type|size limit/i.test(err.message || '');
  const status = err.status || (isClientUploadError ? 400 : 500);
  res.status(status).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
