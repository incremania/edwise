const { isTokenValid } = require("../utils/token");

// Helper function to send error responses
const sendErrorResponse = (res, message, statusCode) => {
  return res.status(statusCode).json({ error: message });
};

// Authentication Middleware
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if(!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No auth header or invalid format");
    return sendErrorResponse(
      res,
      "Authentication token missing or invalid",
      401
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = isTokenValid({ token });
    const { fullName, userId, interests, role} = decodedToken.user;

    req.user = { fullName, userId, interests, role };
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return sendErrorResponse(res, "Invalid authentication token", 401);
  }
};

// Authorization Middleware
const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    console.log("req.user:", req.user);
    if (!req.user || !roles.includes(req.user.role)) {
      return sendErrorResponse(res, "Unauthorized access", 403);
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizePermissions,
};