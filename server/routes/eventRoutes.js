const express = require('express');
const { listUpcomingEvents, getEvent, registerForEvent } = require('../controllers/eventController');

const router = express.Router();

router.get('/', listUpcomingEvents);
router.get('/:id', getEvent);
router.post('/:id/register', registerForEvent);

module.exports = router;
