const express = require('express');
const { listOpenPrograms, getProgram, applyToProgram } = require('../controllers/scholarshipController');

const router = express.Router();

router.get('/', listOpenPrograms);
router.get('/:id', getProgram);
router.post('/:id/apply', applyToProgram);

module.exports = router;
