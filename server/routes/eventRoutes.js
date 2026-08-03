const express = require('express');
const { listUpcomingEvents, getEvent, registerForEvent } = require('../controllers/eventController');
const { checkHoneypot } = require('../middleware/honeypot');
const { standardFormLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.get('/', listUpcomingEvents);
router.get('/:id', getEvent);
router.post('/:id/register', standardFormLimiter, checkHoneypot(), registerForEvent);

module.exports = router;
