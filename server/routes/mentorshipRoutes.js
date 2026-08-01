const express = require('express');
const { listOpenPrograms, getProgram, registerForProgram } = require('../controllers/mentorshipController');

const router = express.Router();

router.get('/', listOpenPrograms);
router.get('/:id', getProgram);
router.post('/:id/register', registerForProgram);

module.exports = router;
