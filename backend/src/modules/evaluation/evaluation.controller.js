const Proposal = require("../proposals/proposal.model");
const RFP = require("../rfps/rfp.model");
const { successResponse, errorResponse } = require("../../utils/response");
const { compareProposals, generateRecommendation } = require("./evaluation.ai");

// Compare proposals for an RFP
const compareRFPProposals = async (req, res) => {
  try {
    const { rfpId } = req.params;

    // Verify RFP exists and user owns it
    const rfp = await RFP.findOne({
      _id: rfpId,
      createdBy: req.user._id,
    });

    if (!rfp) {
      return errorResponse(res, "RFP not found", 404);
    }

    // Get all submitted proposals for this RFP
    const proposals = await Proposal.find({
      rfp: rfpId,
      status: { $in: ["submitted", "under_review"] },
    }).populate("vendor", "name company email phone");

    if (proposals.length === 0) {
      return errorResponse(res, "No proposals found for this RFP", 404);
    }

    if (proposals.length < 2) {
      return errorResponse(
        res,
        "At least 2 proposals are required for comparison",
        400
      );
    }

    // Generate AI comparison
    const comparison = await compareProposals(proposals, rfp);

    successResponse(res, "Proposals compared successfully", {
      rfp: {
        id: rfp._id,
        title: rfp.title,
        budget: rfp.budget,
      },
      proposalsCount: proposals.length,
      proposals: proposals.map((p) => ({
        id: p._id,
        vendor: p.vendor.company,
        cost: p.pricing.totalCost,
        currency: p.pricing.currency,
        complianceScore: p.aiAnalysis?.complianceScore,
        evaluationScore: p.evaluationScore,
        submittedAt: p.submittedAt,
      })),
      comparison,
    });
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// Generate recommendation for best proposal
const getRecommendation = async (req, res) => {
  try {
    const { rfpId } = req.params;

    // Verify RFP exists and user owns it
    const rfp = await RFP.findOne({
      _id: rfpId,
      createdBy: req.user._id,
    });

    if (!rfp) {
      return errorResponse(res, "RFP not found", 404);
    }

    // Get all submitted proposals
    const proposals = await Proposal.find({
      rfp: rfpId,
      status: { $in: ["submitted", "under_review"] },
    }).populate("vendor", "name company email phone");

    if (proposals.length === 0) {
      return errorResponse(res, "No proposals found for this RFP", 404);
    }

    // Generate AI recommendation
    const recommendation = await generateRecommendation(proposals, rfp);

    successResponse(res, "Recommendation generated successfully", {
      rfp: {
        id: rfp._id,
        title: rfp.title,
        description: rfp.description,
        budget: rfp.budget,
        evaluationCriteria: rfp.evaluationCriteria,
      },
      proposalsEvaluated: proposals.length,
      recommendation,
    });
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

module.exports = {
  compareRFPProposals,
  getRecommendation,
};
