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
  console.log(`[LOGGER] Attempting to log: ${action} by ${userId} for Resto ${restaurantId}`);
  
  try {
    // Validate inputs
    if (!restaurantId || !userId || !action) {
      console.error('[LOGGER] Missing required fields:', { restaurantId, userId, action });
      return;
    }

    const log = await ActivityLog.create({
      restaurantId,
      user: userId,
      action,
      description,
      metadata
    });
    
    console.log(`[LOGGER] Success! Log ID: ${log._id}`);
  } catch (error) {
    console.error('[LOGGER] Failed to log activity:', error.message);
    if (error.errors) {
        console.error('[LOGGER] Validation errors:', JSON.stringify(error.errors, null, 2));
    }
  }
};

module.exports = logActivity;
