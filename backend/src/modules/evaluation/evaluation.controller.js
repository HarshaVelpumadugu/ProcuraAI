const Proposal = require("../proposals/proposal.model");
const RFP = require("../rfps/rfp.model");
const Evaluation = require("./evaluation.model");
const { successResponse, errorResponse } = require("../../utils/response");
const { compareProposals, generateRecommendation } = require("./evaluation.ai");

const getAllEvaluations = async (req, res) => {
  try {
    const isVendor = req.user.role === "vendor";

    let evaluations;

    if (isVendor) {
      const vendorId = req.user.vendorId || req.user._id;
      const vendorProposals = await Proposal.find({
        vendor: vendorId,
      }).select("rfp");
      const rfpIds = [...new Set(vendorProposals.map((p) => p.rfp.toString()))];
      evaluations = await Evaluation.find({
        rfp: { $in: rfpIds },
        status: "completed",
      })
        .populate("rfp", "title description budget")
        .populate({
          path: "proposals",
          populate: {
            path: "vendor",
            select: "name company email phone",
          },
        })
        .sort({ lastEvaluatedAt: -1 });
    } else {
      // For buyers: Get evaluations they created
      evaluations = await Evaluation.find({
        evaluatedBy: req.user._id,
      })
        .populate("rfp", "title description budget")
        .populate({
          path: "proposals",
          populate: {
            path: "vendor",
            select: "name company email phone",
          },
        })
        .sort({ lastEvaluatedAt: -1 });
    }

    successResponse(res, "Evaluations retrieved successfully", evaluations);
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    errorResponse(res, error.message, 400);
  }
};

// Compare proposals for an RFP
const compareRFPProposals = async (req, res) => {
  try {
    const { rfpId } = req.params;
    const { forceRefresh } = req.query; // Optional: ?forceRefresh=true to regenerate

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

    // Check if evaluation already exists and is up to date
    let evaluation = await Evaluation.findOne({ rfp: rfpId });

    const shouldRegenerate =
      !evaluation ||
      forceRefresh === "true" ||
      evaluation.proposalsCount !== proposals.length ||
      evaluation.status === "outdated";

    if (shouldRegenerate) {
      console.log("🔄 Generating new comparison...");

      // Generate AI comparison
      const comparison = await compareProposals(proposals, rfp);

      // Create or update evaluation
      const evaluationData = {
        rfp: rfpId,
        proposals: proposals.map((p) => p._id),
        comparison: comparison,
        evaluatedBy: req.user._id,
        proposalsCount: proposals.length,
        lastEvaluatedAt: new Date(),
        status: "completed",
      };

      if (evaluation) {
        evaluation = await Evaluation.findByIdAndUpdate(
          evaluation._id,
          evaluationData,
          { new: true }
        );
      } else {
        evaluation = await Evaluation.create(evaluationData);
      }

      console.log("✅ Comparison saved to database");
    } else {
      console.log("✅ Using cached comparison from database");
    }

    successResponse(res, "Proposals compared successfully", {
      rfp: {
        id: rfp._id,
        title: rfp.title,
        budget: rfp.budget,
      },
      proposalsCount: proposals.length,
      proposals: proposals.map((p) => ({
        id: p._id,
        vendor: p.vendor.company || p.vendor.name,
        cost: p.pricing.totalCost,
        currency: p.pricing.currency,
        complianceScore: p.aiAnalysis?.complianceScore,
        evaluationScore: p.evaluationScore,
        submittedAt: p.submittedAt,
      })),
      comparison: evaluation.comparison,
      cached: !shouldRegenerate,
      lastEvaluated: evaluation.lastEvaluatedAt,
    });
  } catch (error) {
    console.error("Error comparing proposals:", error);
    errorResponse(res, error.message, 400);
  }
};

// Generate recommendation for best proposal
const getRecommendation = async (req, res) => {
  try {
    const { rfpId } = req.params;
    const { forceRefresh } = req.query;

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

    // Check if evaluation already exists
    let evaluation = await Evaluation.findOne({ rfp: rfpId });

    const shouldRegenerate =
      !evaluation ||
      !evaluation.recommendation ||
      forceRefresh === "true" ||
      evaluation.proposalsCount !== proposals.length ||
      evaluation.status === "outdated";

    if (shouldRegenerate) {
      console.log("🔄 Generating new recommendation...");

      // Generate AI recommendation
      const recommendation = await generateRecommendation(proposals, rfp);

      // Create or update evaluation
      const evaluationData = {
        rfp: rfpId,
        proposals: proposals.map((p) => p._id),
        recommendation: recommendation,
        evaluatedBy: req.user._id,
        proposalsCount: proposals.length,
        lastEvaluatedAt: new Date(),
        status: "completed",
      };

      if (evaluation) {
        // Update existing evaluation
        evaluation = await Evaluation.findByIdAndUpdate(
          evaluation._id,
          { ...evaluationData, comparison: evaluation.comparison },
          { new: true }
        );
      } else {
        evaluation = await Evaluation.create(evaluationData);
      }

      console.log("✅ Recommendation saved to database");
    } else {
      console.log("✅ Using cached recommendation from database");
    }

    successResponse(res, "Recommendation generated successfully", {
      rfp: {
        id: rfp._id,
        title: rfp.title,
        description: rfp.description,
        budget: rfp.budget,
      },
      proposalsEvaluated: proposals.length,
      recommendation: evaluation.recommendation,
      cached: !shouldRegenerate,
      lastEvaluated: evaluation.lastEvaluatedAt,
    });
  } catch (error) {
    console.error("Error generating recommendation:", error);
    errorResponse(res, error.message, 400);
  }
};

// Mark evaluation as outdated (call this when new proposal is submitted)
const markEvaluationOutdated = async (rfpId) => {
  try {
    await Evaluation.findOneAndUpdate({ rfp: rfpId }, { status: "outdated" });
    console.log("✅ Evaluation marked as outdated for RFP:", rfpId);
  } catch (error) {
    console.error("Error marking evaluation outdated:", error);
  }
};

// Delete evaluation (optional - for admin or reset)
const deleteEvaluation = async (req, res) => {
  try {
    const { rfpId } = req.params;

    const evaluation = await Evaluation.findOneAndDelete({
      rfp: rfpId,
      evaluatedBy: req.user._id,
    });

    if (!evaluation) {
      return errorResponse(res, "Evaluation not found", 404);
    }

    successResponse(res, "Evaluation deleted successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

module.exports = {
  getAllEvaluations,
  compareRFPProposals,
  getRecommendation,
  markEvaluationOutdated,
  deleteEvaluation,
};
