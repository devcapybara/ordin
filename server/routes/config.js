const express = require('express');
const router = express.Router();
const getPrices = require('../controllers/config/getPrices');

// Public route to get subscription prices
router.get('/prices', getPrices);

module.exports = router;