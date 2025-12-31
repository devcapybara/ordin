const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const checkTenant = require('../middlewares/checkTenant');
const createOrder = require('../controllers/orders/createOrder');
const getOrders = require('../controllers/orders/getOrders');
const updateOrderStatus = require('../controllers/orders/updateOrderStatus');
const getOrderStats = require('../controllers/orders/getOrderStats');
const getOrderByTable = require('../controllers/orders/getOrderByTable');
const payOrder = require('../controllers/orders/payOrder');
const updateOrder = require('../controllers/orders/updateOrder');
const updateTicketStatus = require('../controllers/orders/updateTicketStatus');

router.use(protect);
router.use(checkTenant);

router.get('/stats', getOrderStats);

router.route('/')
  .post(createOrder)
  .get(getOrders);

router.get('/table/:tableNumber', getOrderByTable);

router.put('/:orderId', updateOrder);

router.route('/:id/status')
  .put(updateOrderStatus);

router.put('/:orderId/tickets/:ticketId/status', updateTicketStatus);

router.put('/:id/pay', payOrder);

module.exports = router;
