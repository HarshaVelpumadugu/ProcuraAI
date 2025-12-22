const express = require("express");
const router = express.Router();
const vendorController = require("./vendor.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

router.use(protect);
router.use(authorize("buyer", "admin"));

router.post("/", vendorController.createVendor);

router.get("/", vendorController.getAllVendors);

router.get("/:vendorId", vendorController.getVendorById);

router.put("/:vendorId", vendorController.updateVendor);

router.delete("/:vendorId", vendorController.deleteVendor);

module.exports = router;
