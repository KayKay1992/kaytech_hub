const express = require('express');
const { listActivePlans, getPlan, reserveSpot } = require('../controllers/spaceController');

const router = express.Router();

router.get('/plans', listActivePlans);
router.get('/plans/:id', getPlan);
router.post('/reserve', reserveSpot);

module.exports = router;
