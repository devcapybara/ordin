const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');
const getAgents = require('../controllers/sales/getAgents');
const registerTenant = require('../controllers/sales/registerTenant');
const getMainContact = require('../controllers/sales/getMainContact');
const getSalesStats = require('../controllers/sales/getSalesStats');

// Public route to get sales agents
router.get('/agents', getAgents);
router.get('/main-contact', getMainContact);

// Protected route to register tenant (Sales & SuperAdmin)
router.post('/tenants', protect, checkRole(['SALES', 'SUPER_ADMIN']), registerTenant);

// Sales Stats
router.get('/stats', protect, checkRole(['SALES']), getSalesStats);

module.exports = router;