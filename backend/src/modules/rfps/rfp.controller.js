const RFP = require("./rfp.model");
const Vendor = require("../vendors/vendor.model");
const { successResponse, errorResponse } = require("../../utils/response");
const { sendRFPEmail } = require("../email/email.service");
const { generateRFPSummary } = require("./rfp.ai");

// Create RFP
const createRFP = async (req, res) => {
  try {
    const rfpData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const rfp = await RFP.create(rfpData);
    successResponse(res, "RFP created successfully", rfp, 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// Get all RFPs
const getAllRFPs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;

    let query = {};

    // Different logic for buyers vs vendors
    if (req.user.role === "buyer" || req.user.role === "admin") {
      // Buyers see RFPs they created
      query.createdBy = req.user._id;
    } else if (req.user.role === "vendor") {
      // Vendors see RFPs sent to them
      // First, find the vendor document for this user
      const vendor = await Vendor.findOne({ userId: req.user._id });

      if (!vendor) {
        return successResponse(res, "RFPs retrieved successfully", {
          rfps: [],
          totalPages: 0,
          currentPage: page,
          total: 0,
        });
      }

      // Find RFPs where this vendor is in the sentTo array
      query["sentTo.vendor"] = vendor._id;
    }

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    const rfps = await RFP.find(query)
      .populate("createdBy", "name email company")
      .populate("sentTo.vendor", "name email company")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await RFP.countDocuments(query);

    successResponse(res, "RFPs retrieved successfully", {
      rfps,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// Get single RFP
const getRFPById = async (req, res) => {
  try {
    let rfp;

    if (req.user.role === "buyer" || req.user.role === "admin") {
      // Buyers can only see their own RFPs
      rfp = await RFP.findOne({
        _id: req.params.rfpId,
        createdBy: req.user._id,
      })
        .populate("createdBy", "name email company")
        .populate("sentTo.vendor", "name email company");
    } else if (req.user.role === "vendor") {
      // Vendors can see RFPs sent to them
      const vendor = await Vendor.findOne({ userId: req.user._id });

      if (!vendor) {
        return errorResponse(res, "Vendor profile not found", 404);
      }

      rfp = await RFP.findOne({
        _id: req.params.rfpId,
        "sentTo.vendor": vendor._id,
      })
        .populate("createdBy", "name email company")
        .populate("sentTo.vendor", "name email company");
    }

    if (!rfp) {
      return errorResponse(res, "RFP not found", 404);
    }

    successResponse(res, "RFP retrieved successfully", rfp);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// Update RFP
const updateRFP = async (req, res) => {
  try {
    const rfp = await RFP.findOneAndUpdate(
      { _id: req.params.rfpId, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!rfp) {
      return errorResponse(res, "RFP not found", 404);
    }

    successResponse(res, "RFP updated successfully", rfp);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// Send RFP to vendors
const sendRFP = async (req, res) => {
  try {
    const { vendorIds } = req.body;

    if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return errorResponse(res, "Please provide vendor IDs", 400);
    }

    const rfp = await RFP.findOne({
      _id: req.params.rfpId,
      createdBy: req.user._id,
    });

    if (!rfp) {
      return errorResponse(res, "RFP not found", 404);
    }

    const vendors = await Vendor.find({
      _id: { $in: vendorIds },
      status: "active",
    });

    if (vendors.length === 0) {
      return errorResponse(res, "No valid vendors found", 404);
    }

    // Send emails and update RFP
    const emailPromises = vendors.map((vendor) =>
      sendRFPEmail(vendor.email, rfp, req.user)
    );

    await Promise.all(emailPromises);

    // Update RFP with sent information
    rfp.sentTo = vendors.map((vendor) => ({
      vendor: vendor._id,
      sentAt: new Date(),
      emailStatus: "sent",
    }));
    rfp.status = "open";
    await rfp.save();

    successResponse(res, "RFP sent successfully to vendors", rfp);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// Close RFP
const closeRFP = async (req, res) => {
  try {
    const rfp = await RFP.findOneAndUpdate(
      { _id: req.params.rfpId, createdBy: req.user._id },
      { status: "closed" },
      { new: true }
    );

    if (!rfp) {
      return errorResponse(res, "RFP not found", 404);
    }

    successResponse(res, "RFP closed successfully", rfp);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

module.exports = {
  createRFP,
  getAllRFPs,
  getRFPById,
  updateRFP,
  sendRFP,
  closeRFP,
};
