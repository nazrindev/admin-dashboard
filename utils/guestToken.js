const crypto = require("crypto");

// Generate a unique userId for guests
const generateGuestId = () => {
  return crypto.randomBytes(32).toString("hex"); // 64-char string
};

// Validate if ID is a 64-character hexadecimal guest ID
const isValidGuestId = (id) => {
  return typeof id === "string" && /^[a-f0-9]{64}$/i.test(id);
};

// Extract userId from request safely (handles GET/POST/etc.)
const extractUserId = (req) => {
  return (
    req?.body?.userId ||
    req?.query?.userId ||
    (req?.headers?.authorization?.startsWith("Guest ")
      ? req.headers.authorization.substring(6)
      : null)
  );
};

module.exports = {
  generateGuestId,
  isValidGuestId,
  extractUserId,
};
