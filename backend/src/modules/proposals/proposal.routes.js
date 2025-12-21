const express = require("express");
const router = express.Router();
const proposalController = require("./proposal.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

// All routes require authentication
router.use(protect);

router.get("/", proposalController.getAllProposals);
// ============================================
// VENDOR ROUTES (place these FIRST to avoid conflicts)
// ============================================

// GET /api/proposals/my-proposals - Get all vendor's proposals
router.get(
  "/my-proposals",
  authorize("vendor"),
  proposalController.getMyProposals
);

// GET /api/proposals/my-proposals/:proposalId - Get single proposal
router.get(
  "/my-proposals/:proposalId",
  authorize("vendor"),
  proposalController.getMyProposalById
);

// PUT /api/proposals/my-proposals/:proposalId - Update proposal
router.put(
  "/my-proposals/:proposalId",
  authorize("vendor"),
  proposalController.updateMyProposal
);

// DELETE /api/proposals/my-proposals/:proposalId - Withdraw proposal
router.delete(
  "/my-proposals/:proposalId",
  authorize("vendor"),
  proposalController.withdrawProposal
);

// ============================================
// EXISTING ROUTES (keep these)
// ============================================

// POST /api/proposals - Create proposal (vendor only)
router.post("/", authorize("vendor"), proposalController.createProposal);

// GET /api/proposals/:proposalId - Get single proposal (buyer/admin only)
router.get(
  "/:proposalId",
  authorize("buyer", "admin"),
  proposalController.getProposalById
);

module.exports = router;
