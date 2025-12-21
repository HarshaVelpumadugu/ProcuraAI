const express = require("express");
const router = express.Router();
const emailController = require("./email.controller");

// POST /api/email/inbound - Handle inbound emails (webhook endpoint, no auth)
router.post("/inbound", emailController.handleInboundEmail);

module.exports = router;
