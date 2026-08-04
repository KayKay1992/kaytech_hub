const express = require('express');
const {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  listSubscriptions,
  updateSubscription,
  listPaymentsForSubscription,
  createPaymentForSubscription,
  deletePaymentForSubscription,
  getSpaceRevenue,
} = require('../controllers/adminSpaceController');
const { protect, authorize } = require('../middleware/auth');
const { imageUploadMiddleware } = require('../utils/upload');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/space/plans', listPlans);
router.post('/space/plans', imageUploadMiddleware.single('image'), createPlan);
router.get('/space/revenue', getSpaceRevenue);
router.get('/space/subscriptions', listSubscriptions);
router.patch('/space/subscriptions/:id', updateSubscription);
router.get('/space/subscriptions/:id/payments', listPaymentsForSubscription);
router.post('/space/subscriptions/:id/payments', createPaymentForSubscription);
router.delete('/space/subscriptions/:id/payments/:paymentId', deletePaymentForSubscription);
router.get('/space/plans/:id', getPlan);
router.patch('/space/plans/:id', imageUploadMiddleware.single('image'), updatePlan);

module.exports = router;
