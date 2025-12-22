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
    console.log("Received proposal data:", req.body);

    const proposalData = {
      ...req.body,
      submittedAt: new Date(),
      status: "submitted",
    };

    let vendor = await Vendor.findById(proposalData.vendor);
    if (!vendor) {
      console.log("Vendor not found by _id, trying userId...");
      vendor = await Vendor.findOne({ userId: proposalData.vendor });

      if (vendor) {
        console.log("Vendor found by userId:", vendor._id);
        proposalData.vendor = vendor._id;
      }
    }

    if (!vendor) {
      console.error(" Vendor not found with ID:", proposalData.vendor);
      return errorResponse(
        res,
        "Vendor not found. Please ensure you're logged in as a vendor.",
        404
      );
    }

    console.log("Vendor found:", {
      _id: vendor._id,
      name: vendor.name,
      company: vendor.company,
      email: vendor.email,
      userId: vendor.userId,
    });
    const rfpId = proposalData.rfp || proposalData.rfpId;
    console.log("Looking for RFP with ID:", rfpId);

    const rfp = await RFP.findById(rfpId).populate("createdBy", "email name");

    if (!rfp) {
      console.error("RFP not found with ID:", rfpId);
      return errorResponse(res, "RFP not found", 404);
    }

    if (rfp.status !== "open") {
      return errorResponse(res, "RFP is not accepting proposals", 400);
    }

    if (new Date() > new Date(rfp.deadline)) {
      return errorResponse(res, "RFP deadline has passed", 400);
    }

    const durationWeeks = Number(proposalData.timeline?.duration);

    if (!durationWeeks || durationWeeks <= 0) {
      return errorResponse(res, "Invalid timeline duration", 400);
    }

    const startDate = new Date();

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationWeeks * 7);

    proposalData.timeline = {
      durationWeeks,
      estimatedStartDate: startDate,
      estimatedEndDate: endDate,
    };

    console.log("Creating proposal with vendor ID:", proposalData.vendor);
    const proposal = await Proposal.create(proposalData);
    console.log("Proposal created:", proposal._id);

    // Run AI analysis
    try {
      await markEvaluationOutdated(rfpId);
    } catch (evalError) {
      console.error("Failed to mark evaluation outdated:", evalError.message);
    }

    try {
      if (!proposal.aiAnalysis?.complianceScore) {
        const analysis = await analyzeProposal(proposal, rfp);
        proposal.aiAnalysis = analysis;
        await proposal.save();
      }
    } catch (error) {
      console.error(" AI Analysis failed:", error.message);
    }

    const populatedProposal = await Proposal.findById(proposal._id)
      .populate("rfp", "title description createdBy")
      .populate("vendor", "name company email phone");

    try {
      console.log("Preparing to send email...");
      const vendorForEmail = populatedProposal.vendor || vendor;

      if (!vendorForEmail) {
        throw new Error("Vendor information not available");
      }
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
        console.warn(" Buyer email not found");
      } else {
        console.log("Sending email to:", buyerEmail);
        await sendProposalReceivedEmail(
          buyerEmail,
          populatedProposal,
          vendorForEmail
        );
        console.log(" Email sent successfully!");
      }
    } catch (emailError) {
      console.error("Email error:", emailError.message);
    }

    successResponse(
      res,
      "Proposal submitted successfully. The buyer has been notified via email.",
      populatedProposal,
      201
    );
  } catch (error) {
    console.error("Error creating proposal:", error);
    errorResponse(res, error.message, 400);
  }
};
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

const getProposalById = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.proposalId)
      .populate("rfp", "title description requirements budget deadline")
      .populate("vendor", "name company email phone");

    if (!proposal) {
      return errorResponse(res, "Proposal not found", 404);
    }
    const rfp = await RFP.findById(proposal.rfp._id);
    if (rfp.createdBy.toString() !== req.user._id.toString()) {
      return errorResponse(res, "Not authorized to view this proposal", 403);
    }

    successResponse(res, "Proposal retrieved successfully", proposal);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

const getMyProposals = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const vendor = await Vendor.findOne({ userId: req.user._id });

    if (!vendor) {
      return successResponse(res, "Proposals retrieved successfully", {
        proposals: [],
        totalPages: 0,
        currentPage: page,
        total: 0,
      });
    }
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

const getMyProposalById = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });

    if (!vendor) {
      return errorResponse(res, "Vendor profile not found", 404);
    }

    const proposal = await Proposal.findOne({
      _id: req.params.proposalId,
      vendor: vendor._id,
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

const updateMyProposal = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });

    if (!vendor) {
      return errorResponse(res, "Vendor profile not found", 404);
    }
    const proposal = await Proposal.findOne({
      _id: req.params.proposalId,
      vendor: vendor._id,
    }).populate("rfp");

    if (!proposal) {
      return errorResponse(res, "Proposal not found", 404);
    }

    if (proposal.rfp.status !== "open") {
      return errorResponse(res, "Cannot update proposal for a closed RFP", 400);
    }

    if (new Date() > new Date(proposal.rfp.deadline)) {
      return errorResponse(res, "Cannot update proposal after deadline", 400);
    }
    if (proposal.status === "accepted" || proposal.status === "rejected") {
      return errorResponse(
        res,
        "Cannot update an accepted or rejected proposal",
        400
      );
    }
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

const withdrawProposal = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });

    if (!vendor) {
      return errorResponse(res, "Vendor profile not found", 404);
    }
    const proposal = await Proposal.findOne({
      _id: req.params.proposalId,
      vendor: vendor._id,
    }).populate("rfp");

    if (!proposal) {
      return errorResponse(res, "Proposal not found", 404);
    }
    if (proposal.rfp.status !== "open") {
      return errorResponse(
        res,
        "Cannot withdraw proposal for a closed RFP",
        400
      );
    }
    if (proposal.status === "accepted") {
      return errorResponse(res, "Cannot withdraw an accepted proposal", 400);
    }
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
