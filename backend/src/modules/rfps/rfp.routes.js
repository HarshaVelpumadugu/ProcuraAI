const express = require("express");
const router = express.Router();
const rfpController = require("./rfp.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

// All routes require authentication
router.use(protect);

// POST /api/rfps - Create RFP (buyer/admin only)
router.post("/", authorize("buyer", "admin"), rfpController.createRFP);

// GET /api/rfps - Get all RFPs (buyer/admin only)
router.get(
  "/",
  authorize("buyer", "admin", "vendor"),
  rfpController.getAllRFPs
);

// GET /api/rfps/:rfpId - Get single RFP (buyer/admin only)
router.get(
  "/:rfpId",
  authorize("buyer", "admin", "vendor"),
  rfpController.getRFPById
);

// PUT /api/rfps/:rfpId - Update RFP (buyer/admin only)
router.put("/:rfpId", authorize("buyer", "admin"), rfpController.updateRFP);

// POST /api/rfps/:rfpId/send - Send RFP to vendors (buyer/admin only)
router.post("/:rfpId/send", authorize("buyer", "admin"), rfpController.sendRFP);

// POST /api/rfps/:rfpId/close - Close RFP (buyer/admin only)
router.post(
  "/:rfpId/close",
  authorize("buyer", "admin"),
  rfpController.closeRFP
);

module.exports = router;
