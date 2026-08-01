const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const connectDB = require('./config/db');

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
const serviceRoutes = require('./routes/serviceRoutes');
const adminServiceRoutes = require('./routes/adminServiceRoutes');
const mentorshipRoutes = require('./routes/mentorshipRoutes');
const adminMentorshipRoutes = require('./routes/adminMentorshipRoutes');

const app = express();

connectDB();

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
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminServiceRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/admin', adminMentorshipRoutes);

// 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Central error handler (e.g. multer file-size/type errors)
app.use((err, req, res, next) => {
  console.error(err);
  const isClientUploadError = err instanceof multer.MulterError || /image type|size limit/i.test(err.message || '');
  const status = err.status || (isClientUploadError ? 400 : 500);
  res.status(status).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
