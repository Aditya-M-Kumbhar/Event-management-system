/**
 * In-App Notification Service
 */

const { Notification } = require('../../models/schemas');

const create = async ({ user, type, title, message, link = '', image = '', metadata = {} }) => {
  return Notification.create({ user, type, title, message, link, image, metadata });
};

const markAsRead = async (userId, notificationId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );
};

const markAllAsRead = async (userId) => {
  return Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
};

const getUserNotifications = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip  = (page - 1) * limit;
  const [notifications, total, unread] = await Promise.all([
    Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit),
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);
  return { notifications, total, unread };
};

const deleteNotification = async (userId, notificationId) => {
  return Notification.findOneAndDelete({ _id: notificationId, user: userId });
};

module.exports = { create, markAsRead, markAllAsRead, getUserNotifications, deleteNotification };
