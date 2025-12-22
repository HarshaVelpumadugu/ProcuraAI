const Vendor = require("./vendor.model");
const { successResponse, errorResponse } = require("../../utils/response");

const createVendor = async (req, res) => {
  try {
    const vendorData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const vendor = await Vendor.create(vendorData);
    successResponse(res, "Vendor created successfully", vendor, 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

const getAllVendors = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    const query = req.user.role === "vendor" ? { userId: req.user._id } : {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.categories = category;
    }

    const vendors = await Vendor.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Vendor.countDocuments(query);

    successResponse(res, "Vendors retrieved successfully", {
      vendors,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// Get single vendor
const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      _id: req.params.vendorId,
    });

    if (!vendor) {
      return errorResponse(res, "Vendor not found", 404);
    }

    successResponse(res, "Vendor retrieved successfully", vendor);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// Update vendor
const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndUpdate(
      { _id: req.params.vendorId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!vendor) {
      return errorResponse(res, "Vendor not found", 404);
    }

    successResponse(res, "Vendor updated successfully", vendor);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// Delete vendor
const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndDelete({
      _id: req.params.vendorId,
    });

    if (!vendor) {
      return errorResponse(res, "Vendor not found", 404);
    }

    successResponse(res, "Vendor deleted successfully", null);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

module.exports = {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
};
