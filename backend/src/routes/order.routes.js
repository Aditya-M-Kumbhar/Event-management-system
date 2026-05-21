// order.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/order/order.controller');
const { protect }   = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);
router.post('/',                           ctrl.createOrder);
router.get('/',                            ctrl.getMyOrders);
router.get('/:id',                         ctrl.getOrderById);
router.post('/:id/refund',                 ctrl.requestRefund);
router.get('/event/:eventId/export-csv',   authorize('organiser','admin'), ctrl.exportAttendeesCsv);

module.exports = router;
