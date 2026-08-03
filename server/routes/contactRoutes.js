const express = require('express');
const { submitContactMessage } = require('../controllers/contactController');
const { optionalAuth } = require('../middleware/auth');
const { checkHoneypot } = require('../middleware/honeypot');
const { standardFormLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post('/', standardFormLimiter, optionalAuth, checkHoneypot(), submitContactMessage);

module.exports = router;
