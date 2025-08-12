const { extractUserId, isValidGuestId } = require('../utils/guestToken');

const guestAuthMiddleware = (req, res, next) => {
  try {
    const userId = extractUserId(req);

    if (userId) {
      if (!isValidGuestId(userId)) {
        return res.status(400).json({
          message: 'Invalid guest ID format',
          error: 'User ID must be a 64-character hexadecimal string',
        });
      }

      req.userId = userId;
      req.isGuest = true;
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: 'Error processing user identification',
      error: error.message,
    });
  }
};

module.exports = guestAuthMiddleware;
