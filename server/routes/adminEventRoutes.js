const express = require('express');
const {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  listRegistrationsForEvent,
} = require('../controllers/adminEventController');
const { protect, authorize } = require('../middleware/auth');
const { imageUploadMiddleware } = require('../utils/upload');

const router = express.Router();

router.use(protect, authorize('admin'));

const eventImage = imageUploadMiddleware.fields([{ name: 'image', maxCount: 1 }]);

router.get('/events', listEvents);
router.post('/events', eventImage, createEvent);
router.get('/events/:id', getEvent);
router.patch('/events/:id', eventImage, updateEvent);
router.delete('/events/:id', deleteEvent);
router.get('/events/:id/registrations', listRegistrationsForEvent);

module.exports = router;
