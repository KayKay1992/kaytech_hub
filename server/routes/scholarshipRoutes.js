const express = require('express');
const { listOpenPrograms, getProgram, applyToProgram } = require('../controllers/scholarshipController');
const { checkHoneypot } = require('../middleware/honeypot');
const { standardFormLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.get('/', listOpenPrograms);
router.get('/:id', getProgram);
router.post('/:id/apply', standardFormLimiter, checkHoneypot(), applyToProgram);

module.exports = router;
