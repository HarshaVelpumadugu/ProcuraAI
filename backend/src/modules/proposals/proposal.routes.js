const express = require("express");
const router = express.Router();
const proposalController = require("./proposal.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
router.use(protect);

router.get("/", proposalController.getAllProposals);
router.get(
  "/my-proposals",
  authorize("vendor"),
  proposalController.getMyProposals
);
router.get(
  "/my-proposals/:proposalId",
  authorize("vendor"),
  proposalController.getMyProposalById
);
router.put(
  "/my-proposals/:proposalId",
  authorize("vendor"),
  proposalController.updateMyProposal
);
router.delete(
  "/my-proposals/:proposalId",
  authorize("vendor"),
  proposalController.withdrawProposal
);

router.post("/", authorize("vendor"), proposalController.createProposal);
router.get(
  "/:proposalId",
  authorize("buyer", "admin"),
  proposalController.getProposalById
);

module.exports = router;
