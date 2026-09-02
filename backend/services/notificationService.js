const Notification = require("../models/Notification");

/**
 * Creates a single notification for one user.
 */
const createNotification = async ({ userId, type, title, message, relatedId }) => {
  return Notification.create({ userId, type, title, message, relatedId });
};

/**
 * Creates the same notification for a batch of users.
 * Uses insertMany for efficiency when notifying many students at once.
 */
const createBulkNotifications = async ({
  userIds,
  type,
  title,
  message,
  relatedId,
}) => {
  if (!userIds || userIds.length === 0) return [];

  const docs = userIds.map((userId) => ({
    userId,
    type,
    title,
    message,
    relatedId,
  }));

  return Notification.insertMany(docs);
};

module.exports = { createNotification, createBulkNotifications };
