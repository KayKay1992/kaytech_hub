const express = require('express');
const {
  listPrograms,
  getProgram,
  createProgram,
  updateProgram,
  listRegistrations,
  updateRegistration,
  listPaymentsForRegistration,
  createPaymentForRegistration,
  getMentorshipRevenue,
} = require('../controllers/adminMentorshipController');
const { protect, authorize } = require('../middleware/auth');
const { imageUploadMiddleware } = require('../utils/upload');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/mentorship', listPrograms);
router.post('/mentorship', imageUploadMiddleware.single('image'), createProgram);
router.get('/mentorship/revenue', getMentorshipRevenue);
router.get('/mentorship/registrations', listRegistrations);
router.patch('/mentorship/registrations/:id', updateRegistration);
router.get('/mentorship/registrations/:id/payments', listPaymentsForRegistration);
router.post('/mentorship/registrations/:id/payments', createPaymentForRegistration);
router.get('/mentorship/:id', getProgram);
router.patch('/mentorship/:id', imageUploadMiddleware.single('image'), updateProgram);

module.exports = router;
