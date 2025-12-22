const express = require("express");
const router = express.Router();
const rfpController = require("./rfp.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

router.use(protect);

router.post("/", authorize("buyer", "admin"), rfpController.createRFP);

router.get(
  "/",
  authorize("buyer", "admin", "vendor"),
  rfpController.getAllRFPs
);

router.get(
  "/:rfpId",
  authorize("buyer", "admin", "vendor"),
  rfpController.getRFPById
);

router.put("/:rfpId", authorize("buyer", "admin"), rfpController.updateRFP);

router.post("/:rfpId/send", authorize("buyer", "admin"), rfpController.sendRFP);

router.post(
  "/:rfpId/close",
  authorize("buyer", "admin"),
  rfpController.closeRFP
);

module.exports = router;
