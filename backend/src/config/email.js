const brevo = require("@getbrevo/brevo");

// Initialize Brevo API client
const apiInstance = new brevo.TransactionalEmailsApi();

// Set API key
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// Validate API key exists
if (!process.env.BREVO_API_KEY) {
  console.error("❌ BREVO_API_KEY is not set in environment variables");
  throw new Error("Brevo API key is required");
}

console.log("✅ Brevo configured successfully");

module.exports = apiInstance;

// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   secure: true,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD,
//   },
//   connectionTimeout: 10000,
//   greetingTimeout: 10000,
//   socketTimeout: 10000,
// });

// module.exports = transporter;
