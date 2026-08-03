const express = require('express');
const { listActivePlans, getPlan, reserveSpot } = require('../controllers/spaceController');
const { checkHoneypot } = require('../middleware/honeypot');
const { standardFormLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.get('/plans', listActivePlans);
router.get('/plans/:id', getPlan);
router.post('/reserve', standardFormLimiter, checkHoneypot(), reserveSpot);

module.exports = router;
