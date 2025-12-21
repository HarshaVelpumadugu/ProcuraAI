import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building,
  User,
  Mail,
  Phone,
  Calendar,
  Target,
  TrendingUp,
  Download,
  ExternalLink,
} from "lucide-react";
import { proposalAPI } from "../../../api/proposal.api";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
} from "../../../utils/formatters";
import toast from "react-hot-toast";

const VendorProposalDetail = () => {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposalDetail();
  }, [proposalId]);

  const fetchProposalDetail = async () => {
    try {
      const response = await proposalAPI.getMyProposalById(proposalId);
      console.log("Fetched proposal detail:", response.data);
      setProposal(response.data);
    } catch (error) {
      console.error("Error fetching proposal:", error);
      toast.error("Failed to load proposal details");
      navigate("/vendor/proposals");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "submitted":
        return <Clock className="h-6 w-6 text-blue-500" />;
      case "under_review":
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
      case "accepted":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "rejected":
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  const getComplianceColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  if (loading) return <Loader fullScreen />;
  if (!proposal) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/vendor/proposals")}
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline ml-2">Back</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Proposal Details
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Submitted on {formatDate(proposal.submittedAt)}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-3">
              {getStatusIcon(proposal.status)}
              <span
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(
                  proposal.status
                )}`}
              >
                {proposal.status?.replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* RFP Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">
                  RFP Information
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {proposal.rfp?.title || "Untitled RFP"}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {proposal.rfp?.description || "No description available"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-start gap-3">
                    <Calendar className="text-gray-400 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Deadline</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(proposal.rfp?.deadline)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <DollarSign className="text-gray-400 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">RFP Budget</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(
                          proposal.rfp?.budget?.max,
                          proposal.rfp?.budget?.currency
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                {Array.isArray(proposal.rfp?.requirements) &&
                  proposal.rfp.requirements.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Requirements
                      </h4>
                      <ul className="space-y-2">
                        {proposal.rfp.requirements.map((req, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-gray-600"
                          >
                            <CheckCircle
                              className="text-green-500 mt-0.5 flex-shrink-0"
                              size={16}
                            />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>

            {/* Your Proposal */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="text-purple-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">
                  Your Proposal
                </h2>
              </div>

              {/* Cover Letter */}
              {proposal.coverLetter && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Cover Letter
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {proposal.coverLetter}
                    </p>
                  </div>
                </div>
              )}

              {/* Technical Approach */}
              {(proposal.technicalApproach || proposal.technicalProposal) && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Technical Approach
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {proposal.technicalApproach || proposal.technicalProposal}
                    </p>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {proposal.timeline && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Project Timeline
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {typeof proposal.timeline === "string" ? (
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {proposal.timeline}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {proposal.timeline.durationWeeks && (
                          <div className="flex items-center gap-2">
                            <Clock className="text-gray-400" size={16} />
                            <span className="text-sm text-gray-600">
                              Duration:
                            </span>
                            <span className="font-semibold text-gray-900">
                              {proposal.timeline.durationWeeks} weeks
                            </span>
                          </div>
                        )}
                        {proposal.timeline.estimatedStartDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="text-gray-400" size={16} />
                            <span className="text-sm text-gray-600">
                              Start Date:
                            </span>
                            <span className="font-semibold text-gray-900">
                              {formatDate(proposal.timeline.estimatedStartDate)}
                            </span>
                          </div>
                        )}
                        {proposal.timeline.estimatedEndDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="text-gray-400" size={16} />
                            <span className="text-sm text-gray-600">
                              End Date:
                            </span>
                            <span className="font-semibold text-gray-900">
                              {formatDate(proposal.timeline.estimatedEndDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {Array.isArray(proposal.attachments) &&
                proposal.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      Attachments
                    </h4>
                    <div className="space-y-2">
                      {proposal.attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="text-gray-400" size={20} />
                            <span className="text-sm text-gray-700 truncate">
                              {file.name || `Document ${index + 1}`}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* AI Analysis */}
            {proposal.aiAnalysis && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="text-blue-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">
                    AI Analysis
                  </h2>
                </div>

                {/* Compliance Score */}
                {proposal.aiAnalysis.complianceScore && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Compliance Score
                      </span>
                      <span
                        className={`text-2xl font-bold ${
                          proposal.aiAnalysis.complianceScore >= 80
                            ? "text-green-600"
                            : proposal.aiAnalysis.complianceScore >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {proposal.aiAnalysis.complianceScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          proposal.aiAnalysis.complianceScore >= 80
                            ? "bg-green-500"
                            : proposal.aiAnalysis.complianceScore >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${proposal.aiAnalysis.complianceScore}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Summary */}
                {proposal.aiAnalysis.summary && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Summary
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {proposal.aiAnalysis.summary}
                    </p>
                  </div>
                )}

                {/* Strengths */}
                {Array.isArray(proposal.aiAnalysis.strengths) &&
                  proposal.aiAnalysis.strengths.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-green-700 mb-2">
                        Strengths
                      </h4>
                      <ul className="space-y-2">
                        {proposal.aiAnalysis.strengths.map(
                          (strength, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm text-gray-700"
                            >
                              <CheckCircle
                                className="text-green-500 mt-0.5 flex-shrink-0"
                                size={16}
                              />
                              <span>{strength}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {/* Weaknesses */}
                {Array.isArray(proposal.aiAnalysis.weaknesses) &&
                  proposal.aiAnalysis.weaknesses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-red-700 mb-2">
                        Areas for Improvement
                      </h4>
                      <ul className="space-y-2">
                        {proposal.aiAnalysis.weaknesses.map(
                          (weakness, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm text-gray-700"
                            >
                              <AlertCircle
                                className="text-red-500 mt-0.5 flex-shrink-0"
                                size={16}
                              />
                              <span>{weakness}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="text-green-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Pricing</h2>
              </div>

              <div className="space-y-4">
                {proposal.pricing?.baseCost && (
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Base Cost</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(
                        proposal.pricing.baseCost,
                        proposal.pricing.currency
                      )}
                    </span>
                  </div>
                )}

                {Array.isArray(proposal.pricing?.additionalCosts) &&
                  proposal.pricing.additionalCosts.length > 0 && (
                    <>
                      {proposal.pricing.additionalCosts.map((cost, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-600">
                            {cost.description || "Additional Cost"}
                          </span>
                          <span className="text-gray-900">
                            {formatCurrency(
                              cost.amount,
                              proposal.pricing.currency
                            )}
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                {Array.isArray(proposal.pricing?.breakdown) &&
                  proposal.pricing.breakdown.length > 0 && (
                    <>
                      {proposal.pricing.breakdown.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-600">
                            {item.description || item.name || "Cost Item"}
                          </span>
                          <span className="text-gray-900">
                            {formatCurrency(
                              item.amount || item.cost,
                              proposal.pricing.currency
                            )}
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                  <span className="text-lg font-bold text-gray-900">
                    Total Cost
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      proposal.pricing?.totalCost,
                      proposal.pricing?.currency
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Vendor Info */}
            {proposal.vendor && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="text-blue-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">
                    Your Details
                  </h2>
                </div>

                <div className="space-y-3">
                  {proposal.vendor.company && (
                    <div className="flex items-start gap-3">
                      <Building className="text-gray-400 mt-0.5" size={18} />
                      <div>
                        <p className="text-xs text-gray-500">Company</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {proposal.vendor.company}
                        </p>
                      </div>
                    </div>
                  )}

                  {proposal.vendor.name && (
                    <div className="flex items-start gap-3">
                      <User className="text-gray-400 mt-0.5" size={18} />
                      <div>
                        <p className="text-xs text-gray-500">Contact Person</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {proposal.vendor.name}
                        </p>
                      </div>
                    </div>
                  )}

                  {proposal.vendor.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="text-gray-400 mt-0.5" size={18} />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-semibold text-gray-900 break-all">
                          {proposal.vendor.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {proposal.vendor.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="text-gray-400 mt-0.5" size={18} />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {proposal.vendor.phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate(`/vendor/rfps/${proposal.rfp?._id}`)}
                >
                  <ExternalLink size={16} />
                  <span className="ml-2">View RFP Details</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProposalDetail;
