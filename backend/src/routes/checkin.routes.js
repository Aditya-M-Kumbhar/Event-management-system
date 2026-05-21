// checkin.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/checkin/checkin.controller');
const { protect }   = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect, authorize('organiser','admin'));

router.post('/scan',           ctrl.scanQR);
router.post('/manual',         ctrl.manualCheckIn);
router.get('/stats/:eventId',  ctrl.getCheckInStats);
router.get('/attendees/:eventId', ctrl.getCheckedInAttendees);
router.patch('/undo/:ticketId', authorize('admin'), ctrl.undoCheckIn);

module.exports = router;
