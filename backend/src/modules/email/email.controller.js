const Proposal = require("../proposals/proposal.model");
const RFP = require("../rfps/rfp.model");
const Vendor = require("../vendors/vendor.model");
const User = require("../users/user.model");
const { successResponse, errorResponse } = require("../../utils/response");
const { sendProposalReceivedEmail } = require("./email.service");
const {
  parseProposalEmail,
  validateParsedProposal,
} = require("./email.parser");
const logger = require("../../utils/logger");

/**
 * Handle inbound email webhook
 * This endpoint receives emails from email service providers (SendGrid, Mailgun, AWS SES)
 *
 * Different providers send data in different formats:
 *
 * SendGrid format:
 * - from: sender email
 * - subject: email subject
 * - text: plain text body
 * - html: HTML body
 * - attachments: array of attachment objects
 *
 * Mailgun format:
 * - sender: sender email
 * - subject: email subject
 * - body-plain: plain text
 * - body-html: HTML body
 * - attachment-count: number of attachments
 */
const handleInboundEmail = async (req, res) => {
  try {
    logger.info("Inbound email webhook triggered", {
      headers: req.headers,
      body: Object.keys(req.body),
    });

    // Normalize email data from different providers
    const emailData = normalizeEmailData(req.body, req.headers);

    // Parse the email to extract proposal data
    const parsed = parseProposalEmail(emailData);

    // Validate parsed data
    const validation = validateParsedProposal(parsed);

    if (!validation.isValid) {
      logger.warn("Invalid email data", { errors: validation.errors });
      return errorResponse(
        res,
        `Email parsing failed: ${validation.errors.join(", ")}`,
        400
      );
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      logger.warn("Email parsing warnings", { warnings: validation.warnings });
    }

    // Find the RFP
    const rfp = await RFP.findById(parsed.rfpId);
    if (!rfp) {
      logger.warn("RFP not found", { rfpId: parsed.rfpId });
      return errorResponse(res, "RFP not found", 404);
    }

    // Check if RFP is still accepting proposals
    if (rfp.status !== "open") {
      logger.warn("RFP not accepting proposals", {
        rfpId: parsed.rfpId,
        status: rfp.status,
      });
      return errorResponse(
        res,
        `RFP is ${rfp.status} and not accepting proposals`,
        400
      );
    }

    // Check deadline
    if (new Date() > new Date(rfp.deadline)) {
      logger.warn("RFP deadline passed", {
        rfpId: parsed.rfpId,
        deadline: rfp.deadline,
      });
      return errorResponse(res, "RFP deadline has passed", 400);
    }

    // Find or create vendor
    let vendor = await Vendor.findOne({ email: parsed.vendorInfo.email });

    if (!vendor) {
      // Create a new vendor from email data
      vendor = await Vendor.create({
        name: parsed.vendorInfo.name || parsed.vendorInfo.email.split("@")[0],
        email: parsed.vendorInfo.email,
        company: parsed.vendorInfo.company || "Unknown Company",
        phone: parsed.vendorInfo.phone || "",
        createdBy: rfp.createdBy,
        isActive: true,
      });
      logger.info("New vendor created from email", {
        vendorId: vendor._id,
        email: vendor.email,
      });
    }

    // Check if vendor already submitted a proposal
    const existingProposal = await Proposal.findOne({
      rfp: parsed.rfpId,
      vendor: vendor._id,
    });

    if (existingProposal) {
      logger.warn("Vendor already submitted proposal", {
        vendorId: vendor._id,
        proposalId: existingProposal._id,
      });
      return errorResponse(
        res,
        "You have already submitted a proposal for this RFP",
        400
      );
    }

    // Create proposal from parsed email
    const proposalData = {
      rfp: parsed.rfpId,
      vendor: vendor._id,
      coverLetter: parsed.sections.coverLetter || parsed.sections.fullContent,
      technicalProposal:
        parsed.sections.technicalProposal || parsed.sections.fullContent,
      pricing: {
        totalCost: parsed.pricing.totalCost,
        currency: parsed.pricing.currency,
        breakdown: [],
      },
      status: "submitted",
      submittedAt: new Date(),
    };

    // Add timeline if available
    if (parsed.timeline.startDate || parsed.timeline.endDate) {
      proposalData.timeline = {
        startDate: parsed.timeline.startDate,
        endDate: parsed.timeline.endDate,
        milestones: [],
      };
    }

    // Add attachments if available
    if (parsed.attachments && parsed.attachments.length > 0) {
      proposalData.attachments = parsed.attachments.map((att) => ({
        filename: att.filename,
        url: `email-attachment://${att.filename}`, // You'd upload to S3/storage here
        uploadedAt: new Date(),
      }));
    }

    const proposal = await Proposal.create(proposalData);

    // Run AI analysis in background (don't wait for it)
    runAIAnalysis(proposal._id, rfp._id).catch((err) => {
      logger.error("AI analysis failed", {
        error: err.message,
        proposalId: proposal._id,
      });
    });

    // Notify buyer
    const buyer = await User.findById(rfp.createdBy);
    if (buyer) {
      try {
        await sendProposalReceivedEmail(buyer.email, proposal, vendor);
        logger.info("Buyer notified of new proposal", { buyerId: buyer._id });
      } catch (emailError) {
        logger.error("Failed to notify buyer", { error: emailError.message });
      }
    }

    logger.info("Proposal created from email", {
      proposalId: proposal._id,
      rfpId: parsed.rfpId,
      vendorId: vendor._id,
    });

    successResponse(res, "Proposal received and processed successfully", {
      proposalId: proposal._id,
      rfpId: rfp._id,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        company: vendor.company,
      },
      warnings: validation.warnings,
    });
  } catch (error) {
    logger.error("Error processing inbound email", {
      error: error.message,
      stack: error.stack,
    });
    errorResponse(res, `Failed to process email: ${error.message}`, 500);
  }
};

/**
 * Normalize email data from different providers
 */
const normalizeEmailData = (body, headers) => {
  // Detect provider from headers or body structure
  const provider = detectProvider(body, headers);

  logger.info("Email provider detected", { provider });

  switch (provider) {
    case "sendgrid":
      return {
        from: body.from,
        to: body.to,
        subject: body.subject,
        text: body.text,
        html: body.html,
        attachments: body.attachments || [],
      };

    case "mailgun":
      return {
        from: body.sender || body.from,
        to: body.recipient,
        subject: body.subject || body.Subject,
        text: body["body-plain"] || body["stripped-text"],
        html: body["body-html"] || body["stripped-html"],
        attachments: parseMailgunAttachments(body),
      };

    case "aws-ses":
      return {
        from: body.mail?.source,
        to: body.mail?.destination?.[0],
        subject: body.mail?.commonHeaders?.subject,
        text: body.content,
        html: body.content,
        attachments: [],
      };

    default:
      // Generic format
      return {
        from: body.from || body.sender || body.email,
        to: body.to || body.recipient,
        subject: body.subject,
        text: body.text || body.body || body.content,
        html: body.html || body.body_html,
        attachments: body.attachments || [],
      };
  }
};

/**
 * Detect email service provider
 */
const detectProvider = (body, headers) => {
  if (headers["x-sendgrid-event-id"] || body.from?.includes("sendgrid")) {
    return "sendgrid";
  }
  if (headers["x-mailgun-signature"] || body.sender) {
    return "mailgun";
  }
  if (body.mail?.source || headers["x-amz-sns-message-type"]) {
    return "aws-ses";
  }
  return "generic";
};

/**
 * Parse Mailgun attachments
 */
const parseMailgunAttachments = (body) => {
  const attachments = [];
  const attachmentCount = parseInt(body["attachment-count"] || 0);

  for (let i = 1; i <= attachmentCount; i++) {
    const attachment = body[`attachment-${i}`];
    if (attachment) {
      attachments.push({
        filename: attachment.filename || `attachment-${i}`,
        contentType: attachment.contentType,
        size: attachment.size,
        content: attachment.content,
      });
    }
  }

  return attachments;
};

/**
 * Run AI analysis asynchronously
 */
const runAIAnalysis = async (proposalId, rfpId) => {
  try {
    const { analyzeProposal } = require("../proposals/proposal.ai");
    const proposal = await Proposal.findById(proposalId);
    const rfp = await RFP.findById(rfpId);

    if (proposal && rfp) {
      const analysis = await analyzeProposal(proposal, rfp);
      proposal.aiAnalysis = analysis;
      await proposal.save();
      logger.info("AI analysis completed", { proposalId });
    }
  } catch (error) {
    logger.error("AI analysis error", { error: error.message, proposalId });
  }
};

module.exports = {
  handleInboundEmail,
};
