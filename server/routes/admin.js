const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');

const getRestaurants = require('../controllers/admin/getRestaurants');
const createRestaurant = require('../controllers/admin/createRestaurant');
const updateRestaurant = require('../controllers/admin/updateRestaurant');

// Protect all routes
router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.get('/restaurants', getRestaurants);
router.post('/restaurants', createRestaurant);
router.put('/restaurants/:id', updateRestaurant);

module.exports = router;