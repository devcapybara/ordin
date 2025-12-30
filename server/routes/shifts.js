const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const checkTenant = require('../middlewares/checkTenant');
const startShift = require('../controllers/shifts/startShift');
const endShift = require('../controllers/shifts/endShift');
const getCurrentShift = require('../controllers/shifts/getShift');

router.use(protect);
router.use(checkTenant);

router.post('/start', startShift);
router.post('/end', endShift);
router.get('/current', getCurrentShift);

module.exports = router;
