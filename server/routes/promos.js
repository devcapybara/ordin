const express = require('express');
const router = express.Router();
const checkRole = require('../middlewares/checkRole');
const { protect } = require('../middlewares/auth');
const createPromo = require('../controllers/promos/createPromo');
const getPromos = require('../controllers/promos/getPromos');
const deletePromo = require('../controllers/promos/deletePromo');
const validatePromo = require('../controllers/promos/validatePromo');

router.use(protect);

// Manager/Owner only
router.post('/', checkRole(['OWNER', 'MANAGER']), createPromo);
router.get('/', checkRole(['OWNER', 'MANAGER', 'CASHIER']), getPromos); 
router.delete('/:id', checkRole(['OWNER', 'MANAGER']), deletePromo);

// Cashier (and Owner/Manager) can validate codes
router.post('/validate', checkRole(['OWNER', 'MANAGER', 'CASHIER']), validatePromo);

module.exports = router;
