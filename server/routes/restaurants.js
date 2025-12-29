const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const checkTenant = require('../middlewares/checkTenant');
const checkRole = require('../middlewares/checkRole');
const updateConfigs = require('../controllers/restaurants/updateConfigs');
const getConfigs = require('../controllers/restaurants/getConfigs');

router.use(protect);
router.use(checkTenant);

// Only Owner/Manager can view/edit configs
router.route('/configs')
  .get(checkRole(['OWNER', 'MANAGER']), getConfigs)
  .put(checkRole(['OWNER', 'MANAGER']), updateConfigs);

module.exports = router;
