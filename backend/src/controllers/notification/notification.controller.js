// notification.controller.js
const notificationService = require('../../services/notification/notification.service');
const ApiResponse  = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

exports.getNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await notificationService.getUserNotifications(req.user._id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });
  return ApiResponse.success(res, result);
});

exports.markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.user._id, req.params.id);
  return ApiResponse.success(res, {}, 'Marked as read');
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  return ApiResponse.success(res, {}, 'All notifications marked as read');
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.user._id, req.params.id);
  return ApiResponse.success(res, {}, 'Notification deleted');
});
