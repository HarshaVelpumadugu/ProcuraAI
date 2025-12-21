const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
  {
    rfp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFP",
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    coverLetter: {
      type: String,
      required: [true, "Cover letter is required"],
    },
    technicalProposal: {
      type: String,
      required: [true, "Technical proposal is required"],
    },
    deliverables: {
      type: String,
      required: [true, "Deliverables are required"],
    },
    pricing: {
      totalCost: {
        type: Number,
        required: [true, "Total cost is required"],
      },
      breakdown: [
        {
          item: String,
          quantity: Number,
          unitPrice: Number,
          totalPrice: Number,
        },
      ],
      currency: {
        type: String,
        default: "USD",
      },
    },
    timeline: {
      durationWeeks: {
        type: Number,
        required: true,
        min: 1,
      },
      estimatedStartDate: {
        type: Date,
      },
      estimatedEndDate: {
        type: Date,
      },
    },
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: Date,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "submitted", "under_review", "accepted", "rejected"],
      default: "draft",
    },
    submittedAt: Date,
    evaluationScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    evaluationNotes: String,
    aiAnalysis: {
      strengths: [String],
      weaknesses: [String],
      complianceScore: Number,
      summary: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Proposal", proposalSchema);
