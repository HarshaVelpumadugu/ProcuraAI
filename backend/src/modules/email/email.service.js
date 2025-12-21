const transporter = require("../../config/email");
const logger = require("../../utils/logger");

const sendRFPEmail = async (vendorEmail, rfp, buyer) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: vendorEmail,
      subject: `New RFP: ${rfp.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Request for Proposal</h2>
          <p>Dear Vendor,</p>
          <p>You have received a new RFP from <strong>${
            buyer.company || buyer.name
          }</strong>.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>${rfp.title}</h3>
            <p><strong>Description:</strong></p>
            <p>${rfp.description}</p>
            
            <p><strong>Requirements:</strong></p>
            <p>${rfp.requirements}</p>
            
            <p><strong>Budget:</strong>
              ${
                rfp.budget != null
                  ? `${rfp.currency || "USD"} ${rfp.budget}`
                  : "Not specified"
              }
            </p>
            <p><strong>Deadline:</strong> ${new Date(
              rfp.deadline
            ).toLocaleDateString()}</p>
          </div>
          
          <p>Please submit your proposal before the deadline.</p>
          
          <p>Best regards,<br>${buyer.name}<br>${buyer.company || ""}</p>
          
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">This is an automated message from the RFP Management System.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info("RFP email sent successfully", { vendorEmail, rfpId: rfp._id });
    return true;
  } catch (error) {
    logger.error("Failed to send RFP email", {
      error: error.message,
      vendorEmail,
    });
    throw error;
  }
};

const sendProposalReceivedEmail = async (buyerEmail, proposal, vendor) => {
  try {
    // Validate inputs
    if (!buyerEmail) {
      throw new Error("Buyer email is required");
    }

    if (!vendor) {
      throw new Error("Vendor information is required");
    }

    // Extract vendor details safely
    const vendorCompany = vendor.company || vendor.name || "Unknown Company";
    const vendorName = vendor.name || "Unknown";
    const vendorEmail = vendor.email || "Not provided";
    const totalCost = proposal.pricing?.totalCost || 0;
    const currency = proposal.pricing?.currency || "USD";

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: buyerEmail,
      subject: `New Proposal Received from ${vendorCompany}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Proposal Received</h2>
          <p>A new proposal has been submitted for your RFP.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Vendor:</strong> ${vendorCompany}</p>
            <p><strong>Contact:</strong> ${vendorName} (${vendorEmail})</p>
            <p><strong>Total Cost:</strong> $${totalCost.toLocaleString()} ${currency}</p>
            <p><strong>Submitted:</strong> ${new Date(
              proposal.submittedAt || Date.now()
            ).toLocaleString()}</p>
          </div>
          
          <p>Please log in to the system to review the full proposal.</p>
          
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">This is an automated message from the RFP Management System.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info("✅ Proposal notification email sent", {
      buyerEmail,
      proposalId: proposal._id,
      vendorCompany,
    });
    return true;
  } catch (error) {
    logger.error("❌ Failed to send proposal notification email", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

module.exports = {
  sendRFPEmail,
  sendProposalReceivedEmail,
};
