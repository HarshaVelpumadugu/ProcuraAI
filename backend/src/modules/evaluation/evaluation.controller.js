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

const compareRFPProposals = async (req, res) => {
  try {
    const { rfpId } = req.params;
    const { forceRefresh } = req.query;

    const rfp = await RFP.findOne({
      _id: rfpId,
      createdBy: req.user._id,
    });

    if (!rfp) {
      return errorResponse(res, "RFP not found", 404);
    }
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
    let evaluation = await Evaluation.findOne({ rfp: rfpId });

    const shouldRegenerate =
      !evaluation ||
      forceRefresh === "true" ||
      evaluation.proposalsCount !== proposals.length ||
      evaluation.status === "outdated";

    if (shouldRegenerate) {
      console.log("Generating new comparison...");
      const comparison = await compareProposals(proposals, rfp);
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

      console.log("Comparison saved to database");
    } else {
      console.log("Using cached comparison from database");
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

const getRecommendation = async (req, res) => {
  try {
    const { rfpId } = req.params;
    const { forceRefresh } = req.query;
    const rfp = await RFP.findOne({
      _id: rfpId,
      createdBy: req.user._id,
    });

    if (!rfp) {
      return errorResponse(res, "RFP not found", 404);
    }
    const allProposals = await Proposal.find({
      rfp: rfpId,
    }).populate("vendor", "name company email phone");
    const evaluableProposals = allProposals.filter(
      (p) => p.status !== "rejected"
    );

    if (evaluableProposals.length === 0) {
      return errorResponse(res, "No proposals found for this RFP", 404);
    }
    let evaluation = await Evaluation.findOne({ rfp: rfpId });

    const shouldRegenerate =
      !evaluation ||
      !evaluation.recommendation ||
      forceRefresh === "true" ||
      evaluation.proposalsCount !== evaluableProposals.length ||
      evaluation.status === "outdated";

    if (shouldRegenerate) {
      console.log("Generating new recommendation...");
      const recommendation = await generateRecommendation(
        evaluableProposals,
        rfp
      );
      try {
        const parsedRecommendation = JSON.parse(recommendation);
        const topPickId =
          parsedRecommendation.recommendations?.top_pick?.proposal_id;

        if (
          topPickId &&
          topPickId > 0 &&
          topPickId <= evaluableProposals.length
        ) {
          const topProposal = evaluableProposals[topPickId - 1];

          if (topProposal) {
            if (topProposal.status !== "accepted") {
              await Proposal.findByIdAndUpdate(topProposal._id, {
                status: "accepted",
              });
              console.log(`Proposal ${topProposal._id} marked as accepted`);
            }
          }
        } else {
          console.log("No valid top pick found in recommendation");
        }
      } catch (parseError) {
        console.error(
          "Error parsing recommendation for status update:",
          parseError
        );
      }
      const evaluationData = {
        rfp: rfpId,
        proposals: evaluableProposals.map((p) => p._id),
        recommendation: recommendation,
        evaluatedBy: req.user._id,
        proposalsCount: evaluableProposals.length,
        lastEvaluatedAt: new Date(),
        status: "completed",
      };

      if (evaluation) {
        evaluation = await Evaluation.findByIdAndUpdate(
          evaluation._id,
          { ...evaluationData, comparison: evaluation.comparison },
          { new: true }
        );
      } else {
        evaluation = await Evaluation.create(evaluationData);
      }

      console.log("Recommendation saved to database");
    } else {
      console.log(" Using cached recommendation from database");
      try {
        const parsedRecommendation = JSON.parse(evaluation.recommendation);
        const topPickId =
          parsedRecommendation.recommendations?.top_pick?.proposal_id;

        if (
          topPickId &&
          topPickId > 0 &&
          topPickId <= evaluableProposals.length
        ) {
          const topProposal = evaluableProposals[topPickId - 1];

          if (topProposal && topProposal.status !== "accepted") {
            await Proposal.findByIdAndUpdate(topProposal._id, {
              status: "accepted",
            });
          }
        }
      } catch (parseError) {
        console.error("Error parsing cached recommendation:", parseError);
      }
    }

    successResponse(res, "Recommendation generated successfully", {
      rfp: {
        id: rfp._id,
        title: rfp.title,
        description: rfp.description,
        budget: rfp.budget,
      },
      proposalsEvaluated: evaluableProposals.length,
      recommendation: evaluation.recommendation,
      cached: !shouldRegenerate,
      lastEvaluated: evaluation.lastEvaluatedAt,
    });
  } catch (error) {
    console.error("Error generating recommendation:", error);
    errorResponse(res, error.message, 400);
  }
};

const markEvaluationOutdated = async (rfpId) => {
  try {
    await Evaluation.findOneAndUpdate({ rfp: rfpId }, { status: "outdated" });
  } catch (error) {
    console.error("Error marking evaluation outdated:", error);
  }
};

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
