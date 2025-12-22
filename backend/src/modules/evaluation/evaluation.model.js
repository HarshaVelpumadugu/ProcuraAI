// models/evaluation.model.js
const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema(
  {
    rfp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFP",
      required: true,
      unique: true,
    },
    proposals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Proposal",
      },
    ],
    comparison: {
      type: String,
      default: null,
    },
    recommendation: {
      type: String,
      default: null,
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    proposalsCount: {
      type: Number,
      required: true,
    },
    lastEvaluatedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "outdated"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

evaluationSchema.index({ rfp: 1 });
evaluationSchema.index({ evaluatedBy: 1 });

module.exports = mongoose.model("Evaluation", evaluationSchema);
