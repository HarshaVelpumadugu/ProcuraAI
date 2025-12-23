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

    let comparisonResult;
    let hasError = false;

    if (shouldRegenerate) {
      console.log("Generating new comparison...");

      // ✅ Get comparison result with error info
      comparisonResult = await compareProposals(proposals, rfp);

      if (!comparisonResult.success) {
        console.warn("⚠️ AI comparison failed, using fallback");
        hasError = true;
      }

      const evaluationData = {
        rfp: rfpId,
        proposals: proposals.map((p) => p._id),
        comparison: comparisonResult.data, // Always has data (AI or fallback)
        evaluatedBy: req.user._id,
        proposalsCount: proposals.length,
        lastEvaluatedAt: new Date(),
        status: comparisonResult.success
          ? "completed"
          : "completed_with_warnings",
        metadata: {
          aiGenerationFailed: !comparisonResult.success,
          error: comparisonResult.error,
          isFallback: !comparisonResult.success,
        },
      };

      try {
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
      } catch (dbError) {
        console.error("❌ Failed to save evaluation to database:", dbError);

        // Return comparison even if save fails
        return successResponse(
          res,
          "Comparison generated but not saved. Please try again.",
          {
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
            comparison: comparisonResult.data,
            cached: false,
            warnings: [
              "Comparison was generated but could not be saved",
              "Please try again to save the comparison",
            ],
            aiGenerationFailed: !comparisonResult.success,
            error: comparisonResult.error,
          },
          200
        );
      }
    } else {
      console.log("Using cached comparison from database");
      comparisonResult = {
        success: !evaluation.metadata?.aiGenerationFailed,
        data: evaluation.comparison,
        error: evaluation.metadata?.error,
      };
      hasError = evaluation.metadata?.aiGenerationFailed;
    }

    // ✅ Build response with warnings if AI failed
    const responseData = {
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
      comparison: comparisonResult.data,
      cached: !shouldRegenerate,
      lastEvaluated: evaluation.lastEvaluatedAt,
      aiGenerationFailed: hasError,
    };

    // Add warnings if there were issues
    if (hasError) {
      responseData.warnings = [
        "AI comparison service is temporarily unavailable",
        "A fallback comparison has been generated based on available data",
        "Manual review is recommended for critical decisions",
      ];
      responseData.error = comparisonResult.error;
    }

    successResponse(
      res,
      hasError
        ? "Comparison generated with warnings (AI service unavailable)"
        : "Proposals compared successfully",
      responseData,
      200
    );
  } catch (error) {
    console.error("❌ Critical error in comparison controller:", error);
    errorResponse(
      res,
      "Failed to compare proposals. Please try again or contact support.",
      500,
      {
        details: error.message,
        timestamp: new Date().toISOString(),
      }
    );
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

    let recommendationResult;
    let hasError = false;

    if (shouldRegenerate) {
      console.log("Generating new recommendation...");

      // ✅ Get recommendation with error info
      recommendationResult = await generateRecommendation(
        evaluableProposals,
        rfp
      );

      if (!recommendationResult.success) {
        console.warn("⚠️ AI recommendation failed, using intelligent fallback");
        hasError = true;
      }

      // ✅ Only update proposal status if AI generation succeeded
      if (recommendationResult.success) {
        try {
          const parsedRecommendation = JSON.parse(recommendationResult.data);
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
              console.log(`✅ Proposal ${topProposal._id} marked as accepted`);
            }
          }
        } catch (parseError) {
          console.error("Error parsing recommendation:", parseError);
        }
      } else {
        console.warn("⚠️ Skipping automatic acceptance due to AI failure");
      }

      const evaluationData = {
        rfp: rfpId,
        proposals: evaluableProposals.map((p) => p._id),
        recommendation: recommendationResult.data,
        evaluatedBy: req.user._id,
        proposalsCount: evaluableProposals.length,
        lastEvaluatedAt: new Date(),
        status: recommendationResult.success
          ? "completed"
          : "completed_with_warnings",
        metadata: {
          aiGenerationFailed: !recommendationResult.success,
          error: recommendationResult.error,
          isFallback: !recommendationResult.success,
        },
      };

      try {
        if (evaluation) {
          evaluation = await Evaluation.findByIdAndUpdate(
            evaluation._id,
            { ...evaluationData, comparison: evaluation.comparison },
            { new: true }
          );
        } else {
          evaluation = await Evaluation.create(evaluationData);
        }
        console.log("✅ Recommendation saved to database");
      } catch (dbError) {
        console.error("❌ Failed to save recommendation:", dbError);

        // Return recommendation even if save fails
        return successResponse(
          res,
          "Recommendation generated but not saved. Please try again.",
          {
            rfp: {
              id: rfp._id,
              title: rfp.title,
              description: rfp.description,
              budget: rfp.budget,
            },
            proposalsEvaluated: evaluableProposals.length,
            recommendation: recommendationResult.data,
            cached: false,
            warnings: [
              "Recommendation was generated but could not be saved",
              "Please try again to save the recommendation",
            ],
            aiGenerationFailed: !recommendationResult.success,
            error: recommendationResult.error,
          },
          200
        );
      }
    } else {
      console.log("✅ Using cached recommendation from database");
      recommendationResult = {
        success: !evaluation.metadata?.aiGenerationFailed,
        data: evaluation.recommendation,
        error: evaluation.metadata?.error,
      };
      hasError = evaluation.metadata?.aiGenerationFailed;

      // Check if we should update proposal status from cached recommendation
      if (recommendationResult.success) {
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
    }

    // ✅ Build response with warnings if AI failed
    const responseData = {
      rfp: {
        id: rfp._id,
        title: rfp.title,
        description: rfp.description,
        budget: rfp.budget,
      },
      proposalsEvaluated: evaluableProposals.length,
      recommendation: recommendationResult.data,
      cached: !shouldRegenerate,
      lastEvaluated: evaluation.lastEvaluatedAt,
      aiGenerationFailed: hasError,
    };

    // Add warnings if there were issues
    if (hasError) {
      responseData.warnings = [
        "AI recommendation service is temporarily unavailable",
        "A fallback recommendation has been generated based on compliance and evaluation scores",
        "⚠️ IMPORTANT: Manual review is strongly recommended before making final decisions",
        "The top pick was selected automatically based on highest combined scores",
      ];
      responseData.error = recommendationResult.error;
    }

    successResponse(
      res,
      hasError
        ? "Recommendation generated with warnings (AI service unavailable)"
        : "Recommendation generated successfully",
      responseData,
      200
    );
  } catch (error) {
    console.error("❌ Critical error in recommendation controller:", error);
    errorResponse(
      res,
      "Failed to generate recommendation. Please try again or contact support.",
      500,
      {
        details: error.message,
        timestamp: new Date().toISOString(),
      }
    );
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
