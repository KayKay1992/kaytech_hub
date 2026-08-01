const express = require('express');
const {
  listServices,
  getService,
  createService,
  updateService,
  listRequests,
  updateRequestStatus,
  listPaymentsForRequest,
  createPaymentForRequest,
  getServiceRevenue,
} = require('../controllers/adminServiceController');
const { protect, authorize } = require('../middleware/auth');
const { imageUploadMiddleware } = require('../utils/upload');

const router = express.Router();

router.use(protect, authorize('admin'));

// Cover image (field: image, max 1) and gallery images (field: gallery_images, max 3)
const serviceImages = imageUploadMiddleware.fields([
  { name: 'image', maxCount: 1 },
  { name: 'gallery_images', maxCount: 3 },
]);

router.get('/services', listServices);
router.post('/services', serviceImages, createService);
router.get('/services/revenue', getServiceRevenue);
router.get('/services/requests', listRequests);
router.patch('/services/requests/:id', updateRequestStatus);
router.get('/services/requests/:id/payments', listPaymentsForRequest);
router.post('/services/requests/:id/payments', createPaymentForRequest);
router.get('/services/:id', getService);
router.patch('/services/:id', serviceImages, updateService);

module.exports = router;
