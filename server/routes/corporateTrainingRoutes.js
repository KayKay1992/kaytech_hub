const express = require('express');
const { submitRequest } = require('../controllers/corporateTrainingController');
const { checkHoneypot } = require('../middleware/honeypot');
const { standardFormLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post('/', standardFormLimiter, checkHoneypot(), submitRequest);

module.exports = router;
