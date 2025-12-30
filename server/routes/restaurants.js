const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const checkTenant = require('../middlewares/checkTenant');
const checkRole = require('../middlewares/checkRole');
const updateConfigs = require('../controllers/restaurants/updateConfigs');
const getConfigs = require('../controllers/restaurants/getConfigs');

router.use(protect);
router.use(checkTenant);

// Allow Cashier/Waiter to view configs (needed for POS/Receipt)
router.route('/configs')
  .get(checkRole(['OWNER', 'MANAGER', 'CASHIER', 'WAITER']), getConfigs)
  .put(checkRole(['OWNER', 'MANAGER']), updateConfigs);

module.exports = router;
