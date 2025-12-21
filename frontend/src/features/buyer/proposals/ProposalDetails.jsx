import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, Clock, FileText, User } from "lucide-react";
import { proposalAPI } from "../../../api/proposal.api";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";

const ProposalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposalDetails();
  }, [id]);

  const fetchProposalDetails = async () => {
    try {
      const res = await proposalAPI.getById(id);
      console.log("Fetched proposal details:", res.data);
      setProposal(res.data);
    } catch (err) {
      console.error("Error fetching proposal details:", err);
    }
    setLoading(false);
  };

  if (loading) return <Loader />;
  if (!proposal)
    return <div className="p-4 text-center">Proposal not found</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section - Responsive */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" onClick={() => navigate("/buyer/proposals")}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            Proposal Details
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Review proposal information
          </p>
        </div>
      </div>

      {/* Main Grid - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Proposal Description */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
              Proposal Description
            </h2>
            <p className="text-sm sm:text-base text-gray-600 whitespace-pre-wrap">
              {proposal.coverLetter || "No description provided"}
            </p>
          </div>

          {/* Technical Approach */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
              Technical Approach
            </h2>
            <p className="text-sm sm:text-base text-gray-600 whitespace-pre-wrap">
              {proposal.technicalProposal || "No technical approach provided"}
            </p>
          </div>

          {/* Deliverables */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
              Deliverables
            </h2>
            <p className="text-sm sm:text-base text-gray-600 whitespace-pre-wrap">
              {proposal.deliverables || "No deliverables specified"}
            </p>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Key Information Card */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
              Key Information
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {/* Vendor */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="text-purple-600" size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">Vendor</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                    {proposal.vendor.name || "Unknown"}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="text-green-600" size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Proposed Price
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900">
                    ${proposal.pricing.totalCost?.toLocaleString() || "N/A"}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="text-blue-600" size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">Timeline</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900">
                    {proposal.timeline.durationWeeks
                      ? `${proposal.timeline.durationWeeks} Weeks`
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Submitted Date */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="text-orange-600" size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">Submitted</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900">
                    {new Date(proposal.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetails;
