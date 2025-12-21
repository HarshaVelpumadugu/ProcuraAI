const authService = require("./auth.service");
const { successResponse, errorResponse } = require("../../utils/response");

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    successResponse(res, "User registered successfully", result, 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, "Please provide email and password", 400);
    }

    const result = await authService.login(email, password);
    successResponse(res, "Login successful", result);
  } catch (error) {
    errorResponse(res, error.message, 401);
  }
};

module.exports = {
  register,
  login,
};
