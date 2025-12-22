const express = require("express");
const router = express.Router();
const proposalController = require("../proposals/proposal.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

router.get(
  "/:rfpId/proposals",
  protect,
  authorize("buyer", "admin"),
  proposalController.getProposalsByRFP
);

module.exports = router;
