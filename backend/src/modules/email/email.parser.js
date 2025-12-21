const logger = require("../../utils/logger");

/**
 * Extract RFP ID from email subject or body
 * Supports multiple formats:
 * - Subject: "RE: RFP-507f1f77bcf86cd799439011"
 * - Subject: "Proposal for RFP #507f1f77bcf86cd799439011"
 * - Body: "Reference: RFP-507f1f77bcf86cd799439011"
 */
const extractRFPId = (subject, body) => {
  const text = `${subject} ${body}`;

  // Pattern for MongoDB ObjectId (24 hex characters)
  const patterns = [
    /RFP[:\-\s#]+([a-f0-9]{24})/i,
    /Reference[:\-\s]+RFP[:\-\s#]+([a-f0-9]{24})/i,
    /Proposal\s+for\s+RFP[:\-\s#]+([a-f0-9]{24})/i,
    /([a-f0-9]{24})/i, // Fallback: any 24-char hex string
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      logger.info("RFP ID extracted", { rfpId: match[1] });
      return match[1];
    }
  }

  return null;
};

/**
 * Extract pricing information from email
 * Looks for patterns like:
 * - "Total Cost: $50,000"
 * - "Price: 50000 USD"
 * - "Budget: $50,000.00"
 */
const extractPricing = (text) => {
  const patterns = [
    /(?:total\s+cost|price|budget|amount)[:\s]+\$?([\d,]+(?:\.\d{2})?)\s*(USD|EUR|GBP)?/i,
    /\$\s*([\d,]+(?:\.\d{2})?)/i,
    /([\d,]+(?:\.\d{2})?)\s+(USD|EUR|GBP|INR)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ""));
      const currency = match[2] || "USD";
      logger.info("Pricing extracted", { amount, currency });
      return { totalCost: amount, currency };
    }
  }

  return { totalCost: 0, currency: "USD" };
};

/**
 * Extract timeline/dates from email
 * Looks for dates in various formats
 */
const extractTimeline = (text) => {
  const timeline = {};

  // Look for start date
  const startDatePattern =
    /(?:start\s+date|project\s+start|begin)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i;
  const startMatch = text.match(startDatePattern);
  if (startMatch) {
    timeline.startDate = new Date(startMatch[1]);
  }

  // Look for end date
  const endDatePattern =
    /(?:end\s+date|project\s+end|completion)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i;
  const endMatch = text.match(endDatePattern);
  if (endMatch) {
    timeline.endDate = new Date(endMatch[1]);
  }

  // Look for duration in weeks/months
  const durationPattern =
    /(?:duration|timeline)[:\s]+(\d+)\s+(weeks?|months?)/i;
  const durationMatch = text.match(durationPattern);
  if (durationMatch && timeline.startDate) {
    const duration = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    const endDate = new Date(timeline.startDate);

    if (unit.includes("week")) {
      endDate.setDate(endDate.getDate() + duration * 7);
    } else if (unit.includes("month")) {
      endDate.setMonth(endDate.getMonth() + duration);
    }

    timeline.endDate = endDate;
  }

  logger.info("Timeline extracted", timeline);
  return timeline;
};

/**
 * Extract vendor contact information
 */
const extractVendorInfo = (from, text) => {
  const vendorInfo = {
    email: from,
  };

  // Extract company name
  const companyPattern = /(?:company|organization|firm)[:\s]+([^\n]+)/i;
  const companyMatch = text.match(companyPattern);
  if (companyMatch) {
    vendorInfo.company = companyMatch[1].trim();
  }

  // Extract phone
  const phonePattern = /(?:phone|tel|mobile)[:\s]+([\d\s\-\(\)\+]+)/i;
  const phoneMatch = text.match(phonePattern);
  if (phoneMatch) {
    vendorInfo.phone = phoneMatch[1].trim();
  }

  // Extract contact name from signature
  const namePattern = /(?:regards|sincerely|thanks),?\s*\n\s*([^\n]+)/i;
  const nameMatch = text.match(namePattern);
  if (nameMatch) {
    vendorInfo.name = nameMatch[1].trim();
  }

  return vendorInfo;
};

/**
 * Extract sections from email (cover letter, technical proposal)
 */
const extractProposalSections = (text, html) => {
  const sections = {
    coverLetter: "",
    technicalProposal: "",
    fullContent: text || html || "",
  };

  // Try to identify cover letter section
  const coverLetterPattern =
    /(?:cover\s+letter|introduction)(.*?)(?:technical\s+proposal|technical\s+approach|$)/is;
  const coverMatch = sections.fullContent.match(coverLetterPattern);
  if (coverMatch) {
    sections.coverLetter = coverMatch[1].trim();
  }

  // Try to identify technical proposal section
  const technicalPattern =
    /(?:technical\s+proposal|technical\s+approach|methodology)(.*?)(?:pricing|budget|cost|$)/is;
  const techMatch = sections.fullContent.match(technicalPattern);
  if (techMatch) {
    sections.technicalProposal = techMatch[1].trim();
  }

  // If sections not found, use heuristics
  if (!sections.coverLetter && !sections.technicalProposal) {
    // Split content: first 30% as cover letter, rest as technical
    const splitPoint = Math.floor(sections.fullContent.length * 0.3);
    sections.coverLetter = sections.fullContent.substring(0, splitPoint);
    sections.technicalProposal = sections.fullContent.substring(splitPoint);
  }

  return sections;
};

/**
 * Main parsing function
 */
const parseProposalEmail = (emailData) => {
  try {
    const { from, subject, text, html, attachments = [] } = emailData;

    const fullText = text || html || "";

    logger.info("Parsing proposal email", { from, subject });

    const parsed = {
      rfpId: extractRFPId(subject, fullText),
      vendorInfo: extractVendorInfo(from, fullText),
      pricing: extractPricing(fullText),
      timeline: extractTimeline(fullText),
      sections: extractProposalSections(text, html),
      attachments: attachments.map((att) => ({
        filename: att.filename || att.name,
        contentType: att.contentType || att.type,
        size: att.size,
        content: att.content, // Base64 encoded content
      })),
      rawEmail: {
        subject,
        from,
        receivedAt: new Date(),
      },
    };

    logger.info("Email parsed successfully", {
      rfpId: parsed.rfpId,
      vendorEmail: parsed.vendorInfo.email,
    });

    return parsed;
  } catch (error) {
    logger.error("Error parsing email", { error: error.message });
    throw error;
  }
};

/**
 * Validate parsed email has minimum required data
 */
const validateParsedProposal = (parsed) => {
  const errors = [];

  if (!parsed.rfpId) {
    errors.push("Could not extract RFP ID from email");
  }

  if (!parsed.vendorInfo.email) {
    errors.push("Vendor email is missing");
  }

  if (!parsed.sections.coverLetter && !parsed.sections.technicalProposal) {
    errors.push("Could not extract proposal content");
  }

  if (parsed.pricing.totalCost === 0) {
    errors.push("Warning: Could not extract pricing information");
  }

  return {
    isValid: errors.filter((e) => !e.includes("Warning")).length === 0,
    errors,
    warnings: errors.filter((e) => e.includes("Warning")),
  };
};

module.exports = {
  parseProposalEmail,
  validateParsedProposal,
  extractRFPId,
  extractPricing,
  extractTimeline,
  extractVendorInfo,
  extractProposalSections,
};
