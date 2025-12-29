const ActivityLog = require('../../models/ActivityLog');

/**
 * Logs a user activity to the database.
 * @param {string} restaurantId - The ID of the restaurant.
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} action - Short action code (e.g. 'LOGIN', 'ORDER_CREATED').
 * @param {string} description - Human readable description.
 * @param {object} metadata - Optional additional data (orderId, amount, etc.).
 */
const logActivity = async (restaurantId, userId, action, description, metadata = {}) => {
  try {
    // Fire and forget - don't await if we don't want to block response, 
    // but for safety in this context we'll just execute it.
    await ActivityLog.create({
      restaurantId,
      user: userId,
      action,
      description,
      metadata
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // We don't throw here to avoid disrupting the main flow
  }
};

module.exports = logActivity;