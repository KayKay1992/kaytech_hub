const express = require('express');
const { listActiveServices, getService, requestService } = require('../controllers/serviceController');
const { checkHoneypot } = require('../middleware/honeypot');
const { standardFormLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.get('/', listActiveServices);
router.get('/:id', getService);
router.post('/:id/request', standardFormLimiter, checkHoneypot(), requestService);

module.exports = router;
