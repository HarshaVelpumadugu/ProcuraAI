const express = require("express");
const router = express.Router();
const evaluationController = require("./evaluation.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

// All routes require authentication and buyer/admin role
router.use(protect);

router.get("/", evaluationController.getAllEvaluations);

// POST /api/evaluation/:rfpId/compare - Compare proposals
router.post(
  "/:rfpId/compare",
  authorize("buyer", "admin"),
  evaluationController.compareRFPProposals
);

// GET /api/evaluation/:rfpId/recommendation - Get AI recommendation
router.get(
  "/:rfpId/recommendation",
  authorize("buyer", "admin"),
  evaluationController.getRecommendation
);

module.exports = router;

// // routes/evaluation.routes.js
// const express = require("express");
// const router = express.Router();
// const { protect } = require("../middleware/auth.middleware");
// const {
//   compareRFPProposals,
//   getRecommendation,
//   deleteEvaluation,
//   getAllEvaluations,
// } = require("../controllers/evaluations/evaluation.controller");

// // @route   GET /api/evaluation
// // @desc    Get all evaluations for the logged-in user
// // @access  Private
// router.get("/", protect, getAllEvaluations);

// // @route   POST /api/evaluation/:rfpId/compare
// // @desc    Compare proposals for an RFP
// // @access  Private
// router.post("/:rfpId/compare", protect, compareRFPProposals);

// // @route   GET /api/evaluation/:rfpId/recommendation
// // @desc    Get recommendation for best proposal
// // @access  Private
// router.get("/:rfpId/recommendation", protect, getRecommendation);

// // @route   DELETE /api/evaluation/:rfpId
// // @desc    Delete evaluation for an RFP
// // @access  Private
// router.delete("/:rfpId", protect, deleteEvaluation);

// module.exports = router;
