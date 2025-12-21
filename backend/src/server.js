require("dotenv").config();

const express = require("express");
const cors = require("cors");
const errorHandler = require("./middlewares/error.middleware");
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const PORT = process.env.PORT || 5000;

// Import routes
const authRoutes = require("./modules/auth/auth.routes");
const vendorRoutes = require("./modules/vendors/vendor.routes");
const rfpRoutes = require("./modules/rfps/rfp.routes");
const rfpProposalsRoutes = require("./modules/rfps/rfp.proposals.routes");
const proposalRoutes = require("./modules/proposals/proposal.routes");
const emailRoutes = require("./modules/email/email.routes");
const evaluationRoutes = require("./modules/evaluation/evaluation.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/rfps", rfpRoutes);
app.use("/api/rfps", rfpProposalsRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/evaluation", evaluationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  connectDB();
});

module.exports = app;
