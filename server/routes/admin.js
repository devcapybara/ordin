const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');

const getRestaurants = require('../controllers/admin/getRestaurants');
const createRestaurant = require('../controllers/admin/createRestaurant');
const updateRestaurant = require('../controllers/admin/updateRestaurant');
const approveTenant = require('../controllers/admin/approveTenant');
const {
    getSalesAgents,
    createSalesAgent,
    updateSalesAgent,
    deleteSalesAgent
} = require('../controllers/admin/salesController');
const { getSalesDetail, createPayout } = require('../controllers/admin/salesDetailController');
const { updateConfig, getConfig } = require('../controllers/admin/configController');

// Protect all routes
router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.get('/restaurants', getRestaurants);
router.post('/restaurants', createRestaurant);
router.put('/restaurants/:id', updateRestaurant);
router.put('/restaurants/:id/approve', approveTenant);

// Sales Management Routes
router.get('/sales', getSalesAgents);
router.post('/sales', createSalesAgent);
router.put('/sales/:id', updateSalesAgent);
router.delete('/sales/:id', deleteSalesAgent);
router.get('/sales/:id/detail', getSalesDetail);
router.post('/sales/:id/payout', createPayout);

// Global Config Routes
router.post('/config', updateConfig);
router.get('/config/:key', getConfig);

module.exports = router;