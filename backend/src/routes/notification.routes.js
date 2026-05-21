// notification.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/notification/notification.controller');
const { protect } = require('../middleware/auth.middleware');
router.use(protect);
router.get('/',             ctrl.getNotifications);
router.patch('/:id/read',   ctrl.markAsRead);
router.patch('/read-all',   ctrl.markAllAsRead);
router.delete('/:id',       ctrl.deleteNotification);
module.exports = router;
