const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const checkTenant = require('../middlewares/checkTenant');
const getTableStatus = require('../controllers/tables/getTableStatus');
const clearTable = require('../controllers/tables/clearTable');

router.use(protect);
router.use(checkTenant);

router.get('/status', getTableStatus);
router.post('/clear', clearTable);

module.exports = router;
