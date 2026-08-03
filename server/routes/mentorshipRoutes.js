const express = require('express');
const { listOpenPrograms, getProgram, registerForProgram } = require('../controllers/mentorshipController');
const { checkHoneypot } = require('../middleware/honeypot');
const { standardFormLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.get('/', listOpenPrograms);
router.get('/:id', getProgram);
router.post('/:id/register', standardFormLimiter, checkHoneypot(), registerForProgram);

module.exports = router;
