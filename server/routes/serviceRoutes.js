const express = require('express');
const { listActiveServices, getService, requestService } = require('../controllers/serviceController');

const router = express.Router();

router.get('/', listActiveServices);
router.get('/:id', getService);
router.post('/:id/request', requestService);

module.exports = router;
