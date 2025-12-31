const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');
const checkTenant = require('../middlewares/checkTenant');

const getEmployees = require('../controllers/users/getEmployees');
const createEmployee = require('../controllers/users/createEmployee');
const updateEmployee = require('../controllers/users/updateEmployee');
const deleteEmployee = require('../controllers/users/deleteEmployee');

router.use(protect);
router.use(checkTenant);
router.use(checkRole(['OWNER', 'MANAGER']));

router.get('/', getEmployees);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;