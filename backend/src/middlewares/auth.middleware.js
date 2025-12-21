const { verifyToken } = require("../config/jwt");
const User = require("../modules/users/user.model");
const { errorResponse } = require("../utils/response");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return errorResponse(res, "Not authorized to access this route", 401);
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return errorResponse(res, "Invalid or expired token", 401);
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    if (!user.isActive) {
      return errorResponse(res, "Account is deactivated", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, "Not authorized to access this route", 401);
  }
};

module.exports = { protect };
