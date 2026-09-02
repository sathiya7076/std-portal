const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildMeta } = require("../utils/paginate");

// @desc    Get notifications for the current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { userId: req.user._id };

  if (req.query.isRead !== undefined) {
    filter.isRead = req.query.isRead === "true";
  }
  if (req.query.type) {
    filter.type = req.query.type;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ]);

  return sendSuccess(
    res,
    200,
    "Notifications fetched successfully",
    notifications,
    { ...buildMeta(total, page, limit), unreadCount }
  );
});

// @desc    Create a notification (manual/admin use, e.g. announcements)
// @route   POST /api/notifications
// @access  Private (trainer only)
const createNotificationHandler = asyncHandler(async (req, res) => {
  const { userId, type, title, message, relatedId } = req.body;

  if (!userId || !type || !title) {
    throw new ApiError(400, "userId, type, and title are required");
  }

  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    relatedId,
  });

  return sendSuccess(res, 201, "Notification created successfully", notification);
});

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private (owner only)
const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw new ApiError(404, "Notification not found");

  if (notification.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only update your own notifications");
  }

  notification.isRead = true;
  await notification.save();

  return sendSuccess(res, 200, "Notification marked as read", notification);
});

// @desc    Mark all notifications as read for the current user
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  return sendSuccess(res, 200, "All notifications marked as read", {});
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private (owner only)
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw new ApiError(404, "Notification not found");

  if (notification.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own notifications");
  }

  await Notification.deleteOne({ _id: notification._id });

  return sendSuccess(res, 200, "Notification deleted successfully", {});
});

module.exports = {
  getNotifications,
  createNotificationHandler,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
