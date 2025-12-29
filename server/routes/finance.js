const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');
const checkTenant = require('../middlewares/checkTenant');
const checkFeatureAccess = require('../middlewares/checkFeatureAccess');

const createExpense = require('../controllers/finance/createExpense');
const getExpenses = require('../controllers/finance/getExpenses');
const deleteExpense = require('../controllers/finance/deleteExpense');
const getFinanceReport = require('../controllers/finance/getFinanceReport');

router.use(protect);
router.use(checkTenant);
// Enforce Subscription Plan (PRO/ENTERPRISE only)
router.use(checkFeatureAccess('FINANCE'));
// Allow Accountant, Owner, Manager
router.use(checkRole(['OWNER', 'MANAGER', 'ACCOUNTANT']));

router.route('/expenses')
    .get(getExpenses)
    .post(createExpense);

router.delete('/expenses/:id', deleteExpense);

router.get('/report', getFinanceReport);

module.exports = router;