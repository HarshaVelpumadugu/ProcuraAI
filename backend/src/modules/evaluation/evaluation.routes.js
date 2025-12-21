const express = require("express");
const router = express.Router();
const evaluationController = require("./evaluation.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

// All routes require authentication and buyer/admin role
router.use(protect);
router.use(authorize("buyer", "admin"));

// POST /api/evaluation/:rfpId/compare - Compare proposals
router.post("/:rfpId/compare", evaluationController.compareRFPProposals);

// GET /api/evaluation/:rfpId/recommendation - Get AI recommendation
router.get("/:rfpId/recommendation", evaluationController.getRecommendation);

module.exports = router;
