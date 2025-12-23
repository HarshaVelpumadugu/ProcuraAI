const apiInstance = require("../../config/email");
const brevo = require("@getbrevo/brevo");
const logger = require("../../utils/logger");

const sendRFPEmail = async (vendorEmail, rfp, buyer) => {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = `New RFP: ${rfp.title}`;
    sendSmtpEmail.htmlContent = `
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
    `;

    sendSmtpEmail.sender = {
      name: "ProcuraAI",
      email: process.env.EMAIL_FROM,
    };

    sendSmtpEmail.to = [
      {
        email: vendorEmail,
        name: "Vendor",
      },
    ];

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    logger.info("RFP email sent successfully", { vendorEmail, rfpId: rfp._id });
    return true;
  } catch (error) {
    logger.error("Failed to send RFP email", {
      error: error.message,
      body: error.body,
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

    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = `New Proposal Received from ${vendorCompany}`;
    sendSmtpEmail.htmlContent = `
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
    `;

    sendSmtpEmail.sender = {
      name: "ProcuraAI",
      email: process.env.EMAIL_FROM,
    };

    sendSmtpEmail.to = [
      {
        email: buyerEmail,
        name: "Buyer",
      },
    ];

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    logger.info("✅ Proposal notification email sent", {
      buyerEmail,
      proposalId: proposal._id,
      vendorCompany,
    });
    return true;
  } catch (error) {
    // Enhanced error logging for Brevo - capture ALL possible error properties
    const errorDetails = {
      message: error.message,
      status: error.status || error.response?.status,
      statusText: error.statusText || error.response?.statusText,
      // Try multiple paths to get error body
      body:
        error.body ||
        error.response?.body ||
        error.response?.data ||
        error.response?.text,
      // Additional error properties
      code: error.code,
      name: error.name,
      // Request details for debugging
      requestData: {
        to: buyerEmail,
        from: process.env.EMAIL_FROM,
        subject: `New Proposal Received from ${vendor.company || vendor.name}`,
      },
      // Full error object (stringified to see all properties)
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    };

    logger.error("❌ Failed to send proposal notification email", errorDetails);

    // Console logs for immediate debugging
    console.error("\n🔴 ===== BREVO EMAIL ERROR DETAILS =====");
    console.error("Error Message:", error.message);
    console.error("Status Code:", error.status || error.response?.status);
    console.error("Error Name:", error.name);
    console.error("Error Code:", error.code);

    // Try to extract and display body in different formats
    const responseBody =
      error.body || error.response?.body || error.response?.data;
    if (responseBody) {
      console.error("Response Body:", JSON.stringify(responseBody, null, 2));
    } else {
      console.error("Response Body: Not available");
      console.error("Raw Error:", error);
    }

    console.error("\nRequest Details:");
    console.error("  To:", buyerEmail);
    console.error("  From:", process.env.EMAIL_FROM);
    console.error("  API Key Set:", !!process.env.BREVO_API_KEY);
    console.error("========================================\n");

    // Provide helpful error messages based on status
    if (error.status === 401 || error.response?.status === 401) {
      console.error("💡 FIX: Invalid API key");
      console.error("   1. Check BREVO_API_KEY in .env file");
      console.error(
        "   2. Generate new key at: https://app.brevo.com/settings/keys/api"
      );
      console.error("   3. Restart your server after updating .env\n");
    } else if (error.status === 400 || error.response?.status === 400) {
      console.error("💡 FIX: Bad Request - Most likely sender not verified");
      console.error("   1. Go to: https://app.brevo.com/settings/senders");
      console.error(
        "   2. Verify that",
        process.env.EMAIL_FROM,
        "has a ✅ green checkmark"
      );
      console.error(
        '   3. If not verified, click "Add sender" and verify the email'
      );
      console.error("   4. Check your inbox for verification email from Brevo");
      console.error(
        "   5. Click verification link and wait for confirmation\n"
      );
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      console.error("💡 FIX: Network/Connection issue");
      console.error("   1. Check your internet connection");
      console.error("   2. Verify Brevo API is accessible");
      console.error("   3. Check if firewall is blocking the request\n");
    }

    throw error;
  }
};

module.exports = {
  sendRFPEmail,
  sendProposalReceivedEmail,
};
