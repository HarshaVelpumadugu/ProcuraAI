const mongoose = require("mongoose");

const rfpSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "RFP title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    requirements: {
      type: String,
      required: [true, "Requirements are required"],
    },
    budget: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },
    category: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: Date,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "open", "closed", "awarded"],
      default: "draft",
    },
    sentTo: [
      {
        vendor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Vendor",
        },
        sentAt: Date,
        emailStatus: {
          type: String,
          enum: ["pending", "sent", "failed"],
          default: "pending",
        },
      },
    ],
    evaluationCriteria: [
      {
        criterion: String,
        weight: Number,
        description: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RFP", rfpSchema);
