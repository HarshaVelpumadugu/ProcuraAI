const express = require("express");
const router = express.Router();
const vendorController = require("./vendor.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

// All routes require authentication and buyer/admin role
router.use(protect);
router.use(authorize("buyer", "admin"));

// POST /api/vendors
router.post("/", vendorController.createVendor);

// GET /api/vendors
router.get("/", vendorController.getAllVendors);

// GET /api/vendors/:vendorId
router.get("/:vendorId", vendorController.getVendorById);

// PUT /api/vendors/:vendorId
router.put("/:vendorId", vendorController.updateVendor);

// DELETE /api/vendors/:vendorId
router.delete("/:vendorId", vendorController.deleteVendor);

module.exports = router;
