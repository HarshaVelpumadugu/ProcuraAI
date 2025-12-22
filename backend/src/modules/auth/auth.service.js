const User = require("../users/user.model");
const { generateToken } = require("../../config/jwt");
const Vendor = require("../vendors/vendor.model");

const register = async (userData) => {
  const { name, email, password, role, company, phone } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  if (role === "vendor") {
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      throw new Error("A vendor is already registered with this email");
    }
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    company,
    phone,
  });

  let createdVendor = null;
  if (role === "vendor") {
    createdVendor = await Vendor.create({
      name: user.name,
      email: user.email,
      phone: user.phone,
      company: user.company,
      userId: user._id,
      createdBy: user._id,
    });
  }
  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      vendorId: createdVendor ? createdVendor._id : null,
    },
    token,
  };
};

const login = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Invalid credentials");
  }
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  if (!user.isActive) {
    throw new Error("Account is deactivated");
  }

  let vendorId = null;
  if (user.role === "vendor") {
    const vendor = await Vendor.findOne({ userId: user._id });
    if (vendor) {
      vendorId = vendor._id;
      console.log("Vendor found:", vendorId);
    } else {
      console.warn("User is vendor but no Vendor document found");
    }
  }
  const token = generateToken(user._id);

  return {
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      vendorId: vendorId,
    },
    token,
  };
};

module.exports = {
  register,
  login,
};
