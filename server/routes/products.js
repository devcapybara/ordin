const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const checkTenant = require('../middlewares/checkTenant');
const checkRole = require('../middlewares/checkRole');
const checkFeatureAccess = require('../middlewares/checkFeatureAccess');
const createProduct = require('../controllers/products/createProduct');
const getProducts = require('../controllers/products/getProducts');
const updateProduct = require('../controllers/products/updateProduct');
const deleteProduct = require('../controllers/products/deleteProduct');

// All product routes should be protected and tenant-checked
router.use(protect);
router.use(checkTenant);

router.route('/')
  .get(getProducts)
  .post(checkRole(['OWNER', 'MANAGER']), checkFeatureAccess('INVENTORY'), createProduct);

router.route('/:id')
  .put(checkRole(['OWNER', 'MANAGER', 'KITCHEN']), updateProduct) // Kitchen needs to toggle availability
  .delete(checkRole(['OWNER', 'MANAGER']), checkFeatureAccess('INVENTORY'), deleteProduct);

module.exports = router;
