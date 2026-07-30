const express = require('express');
const { submitContactMessage } = require('../controllers/contactController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', optionalAuth, submitContactMessage);

module.exports = router;
