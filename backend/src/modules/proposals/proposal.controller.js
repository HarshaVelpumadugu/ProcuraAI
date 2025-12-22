const Proposal = require("./proposal.model");
const RFP = require("../rfps/rfp.model");
const { successResponse, errorResponse } = require("../../utils/response");
const { analyzeProposal } = require("./proposal.ai");
const { sendProposalReceivedEmail } = require("../email/email.service");
const User = require("../users/user.model");
const Vendor = require("../vendors/vendor.model");
const {
  markEvaluationOutdated,
} = require("../evaluation/evaluation.controller");

// Existing createProposal function (keep as is)
const createProposal = async (req, res) => {
  try {
    console.log("📥 Received proposal data:", req.body);

    const proposalData = {
      ...req.body,
      submittedAt: new Date(),
      status: "submitted",
    };

    // ✅ Find vendor by the ID provided (could be User ID or Vendor ID)
    let vendor = await Vendor.findById(proposalData.vendor);

    // If not found by _id, try finding by userId
    if (!vendor) {
      console.log("🔍 Vendor not found by _id, trying userId...");
      vendor = await Vendor.findOne({ userId: proposalData.vendor });

      if (vendor) {
        console.log("✅ Vendor found by userId:", vendor._id);
        // Update the proposal data to use the correct vendor _id
        proposalData.vendor = vendor._id;
      }
    }

    if (!vendor) {
      console.error("❌ Vendor not found with ID:", proposalData.vendor);
      return errorResponse(
        res,
        "Vendor not found. Please ensure you're logged in as a vendor.",
        404
      );
    }

    console.log("✅ Vendor found:", {
      _id: vendor._id,
      name: vendor.name,
      company: vendor.company,
      email: vendor.email,
      userId: vendor.userId,
    });

    // ✅ Check if RFP exists and is open
    const rfpId = proposalData.rfp || proposalData.rfpId;
    console.log("🔍 Looking for RFP with ID:", rfpId);

    const rfp = await RFP.findById(rfpId).populate("createdBy", "email name");

    if (!rfp) {
      console.error("❌ RFP not found with ID:", rfpId);
      return errorResponse(res, "RFP not found", 404);
    }

    console.log("✅ RFP found:", rfp.title);

    if (rfp.status !== "open") {
      return errorResponse(res, "RFP is not accepting proposals", 400);
    }

    if (new Date() > new Date(rfp.deadline)) {
      return errorResponse(res, "RFP deadline has passed", 400);
    }

    // ===== TIMELINE CALCULATION =====
    const durationWeeks = Number(proposalData.timeline?.duration);

    if (!durationWeeks || durationWeeks <= 0) {
      return errorResponse(res, "Invalid timeline duration", 400);
    }

    // Start date = now
    const startDate = new Date();

    // End date = now + weeks
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationWeeks * 7);

    // Attach computed timeline (overwrite frontend value safely)
    proposalData.timeline = {
      durationWeeks,
      estimatedStartDate: startDate,
      estimatedEndDate: endDate,
    };

    // ✅ Create proposal with the correct vendor ID
    console.log("💾 Creating proposal with vendor ID:", proposalData.vendor);
    const proposal = await Proposal.create(proposalData);
    console.log("✅ Proposal created:", proposal._id);

    // Run AI analysis
    try {
      await markEvaluationOutdated(rfpId);
      console.log("✅ Evaluation marked as outdated for RFP:", rfpId);
    } catch (evalError) {
      console.error(
        "⚠️ Failed to mark evaluation outdated:",
        evalError.message
      );
    }

    try {
      if (!proposal.aiAnalysis?.complianceScore) {
        const analysis = await analyzeProposal(proposal, rfp);
        proposal.aiAnalysis = analysis;
        await proposal.save();
      }
    } catch (error) {
      console.error("⚠️ AI Analysis failed:", error.message);
    }

    // Populate proposal
    const populatedProposal = await Proposal.findById(proposal._id)
      .populate("rfp", "title description createdBy")
      .populate("vendor", "name company email phone");

    console.log(
      "✅ Populated proposal - Vendor:",
      populatedProposal.vendor ? "Found" : "NOT FOUND"
    );

    // ✅ Send email notification
    try {
      console.log("📧 Preparing to send email...");

      // Use the vendor we already have (most reliable)
      const vendorForEmail = populatedProposal.vendor || vendor;

      if (!vendorForEmail) {
        throw new Error("Vendor information not available");
      }

      // Get buyer email
      let buyerEmail;

      if (
        rfp.createdBy &&
        typeof rfp.createdBy === "object" &&
        rfp.createdBy.email
      ) {
        buyerEmail = rfp.createdBy.email;
      } else if (rfp.createdBy) {
        const buyer = await User.findById(rfp.createdBy).select("email name");
        buyerEmail = buyer?.email;
      }

      if (!buyerEmail) {
        console.warn("⚠️ Buyer email not found");
      } else {
        console.log("📧 Sending email to:", buyerEmail);
        await sendProposalReceivedEmail(
          buyerEmail,
          populatedProposal,
          vendorForEmail
        );
        console.log("✅ Email sent successfully!");
      }
    } catch (emailError) {
      console.error("❌ Email error:", emailError.message);
    }

    successResponse(
      res,
      "Proposal submitted successfully. The buyer has been notified via email.",
      populatedProposal,
      201
    );
  } catch (error) {
    console.error("❌ Error creating proposal:", error);
    errorResponse(res, error.message, 400);
  }
};

// Existing getProposalsByRFP function (keep as is)
const getProposalsByRFP = async (req, res) => {
  try {
    const rfp = await RFP.findOne({
      _id: req.params.rfpId,
      createdBy: req.user._id,
    });

    if (!rfp) {
      return errorResponse(res, "RFP not found", 404);
    }

    const proposals = await Proposal.find({ rfp: req.params.rfpId })
      .populate("vendor", "name company email phone")
      .sort({ submittedAt: -1 });

    successResponse(res, "Proposals retrieved successfully", proposals);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

const getAllProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find()
      .populate("rfp", "title budget deadline status")
      .populate("vendor", "name company email")
      .sort({ submittedAt: -1 });

    successResponse(res, "Proposals retrieved successfully", proposals);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// Existing getProposalById function (keep as is)
const getProposalById = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.proposalId)
      .populate("rfp", "title description requirements budget deadline")
      .populate("vendor", "name company email phone");

    if (!proposal) {
      return errorResponse(res, "Proposal not found", 404);
    }

    //Check if user is authorized to view this proposal
    const rfp = await RFP.findById(proposal.rfp._id);
    if (rfp.createdBy.toString() !== req.user._id.toString()) {
      return errorResponse(res, "Not authorized to view this proposal", 403);
    }

    successResponse(res, "Proposal retrieved successfully", proposal);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// ============================================
// ✅ NEW: VENDOR-SPECIFIC ROUTES
// ============================================

// Get all proposals submitted by this vendor
const getMyProposals = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Find vendor profile for this user
    const vendor = await Vendor.findOne({ userId: req.user._id });

    if (!vendor) {
      return successResponse(res, "Proposals retrieved successfully", {
        proposals: [],
        totalPages: 0,
        currentPage: page,
        total: 0,
      });
    }

    // Build query
    const query = { vendor: vendor._id };

    if (status) {
      query.status = status;
    }

    // Get proposals
    const proposals = await Proposal.find(query)
      .populate("rfp", "title description deadline budget status")
      .populate("vendor", "name email company")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ submittedAt: -1 });

    const count = await Proposal.countDocuments(query);

    successResponse(res, "Proposals retrieved successfully", {
      proposals,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error("Error in getMyProposals:", error);
    errorResponse(res, error.message, 400);
  }
};

// Get a single proposal by ID (vendor's own)
const getMyProposalById = async (req, res) => {
  try {
    // Find vendor profile for this user
    const vendor = await Vendor.findOne({ userId: req.user._id });

    if (!vendor) {
      return errorResponse(res, "Vendor profile not found", 404);
    }

    const proposal = await Proposal.findOne({
      _id: req.params.proposalId,
      vendor: vendor._id, // Ensure vendor can only see their own proposals
    })
      .populate("rfp", "title description requirements deadline budget status")
      .populate("vendor", "name email company phone");

    if (!proposal) {
      return errorResponse(res, "Proposal not found", 404);
    }

    successResponse(res, "Proposal retrieved successfully", proposal);
  } catch (error) {
    console.error("Error in getMyProposalById:", error);
    errorResponse(res, error.message, 400);
  }
};

// Update a proposal (vendor can update before deadline)
const updateMyProposal = async (req, res) => {
  try {
    // Find vendor profile for this user
    const vendor = await Vendor.findOne({ userId: req.user._id });

    if (!vendor) {
      return errorResponse(res, "Vendor profile not found", 404);
    }

    // Find proposal and check if it belongs to this vendor
    const proposal = await Proposal.findOne({
      _id: req.params.proposalId,
      vendor: vendor._id,
    }).populate("rfp");

    if (!proposal) {
      return errorResponse(res, "Proposal not found", 404);
    }

    // Check if RFP is still open
    if (proposal.rfp.status !== "open") {
      return errorResponse(res, "Cannot update proposal for a closed RFP", 400);
    }

    // Check if deadline has passed
    if (new Date() > new Date(proposal.rfp.deadline)) {
      return errorResponse(res, "Cannot update proposal after deadline", 400);
    }

    // Check if proposal is already accepted/rejected
    if (proposal.status === "accepted" || proposal.status === "rejected") {
      return errorResponse(
        res,
        "Cannot update an accepted or rejected proposal",
        400
      );
    }

    // Update proposal
    const updatedProposal = await Proposal.findByIdAndUpdate(
      req.params.proposalId,
      {
        ...req.body,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate("rfp", "title description deadline")
      .populate("vendor", "name email company");

    successResponse(res, "Proposal updated successfully", updatedProposal);
  } catch (error) {
    console.error("Error in updateMyProposal:", error);
    errorResponse(res, error.message, 400);
  }
};

// Withdraw a proposal
const withdrawProposal = async (req, res) => {
  try {
    // Find vendor profile for this user
    const vendor = await Vendor.findOne({ userId: req.user._id });

    if (!vendor) {
      return errorResponse(res, "Vendor profile not found", 404);
    }

    // Find proposal and check if it belongs to this vendor
    const proposal = await Proposal.findOne({
      _id: req.params.proposalId,
      vendor: vendor._id,
    }).populate("rfp");

    if (!proposal) {
      return errorResponse(res, "Proposal not found", 404);
    }

    // Check if RFP is still open
    if (proposal.rfp.status !== "open") {
      return errorResponse(
        res,
        "Cannot withdraw proposal for a closed RFP",
        400
      );
    }

    // Check if proposal is already accepted
    if (proposal.status === "accepted") {
      return errorResponse(res, "Cannot withdraw an accepted proposal", 400);
    }

    // Delete proposal
    await Proposal.findByIdAndDelete(req.params.proposalId);

    successResponse(res, "Proposal withdrawn successfully", null);
  } catch (error) {
    console.error("Error in withdrawProposal:", error);
    errorResponse(res, error.message, 400);
  }
};

module.exports = {
  createProposal,
  getProposalsByRFP,
  getProposalById,
  getAllProposals,
  getMyProposals,
  getMyProposalById,
  updateMyProposal,
  withdrawProposal,
};
