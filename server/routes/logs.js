const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');
const checkTenant = require('../middlewares/checkTenant');

const getLogs = require('../controllers/logs/getLogs');

router.use(protect);
router.use(checkTenant);
router.use(checkRole(['OWNER', 'MANAGER']));

router.get('/', getLogs);

module.exports = router;