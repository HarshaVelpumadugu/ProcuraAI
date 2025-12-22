// features/vendor/proposals/SubmitProposal.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { proposalAPI } from "../../../api/proposal.api";
import { rfpAPI } from "../../../api/rfp.api";
import Button from "../../../components/common/Button";
import ProposalForm from "../../../components/forms/ProposalForm";
import Loader from "../../../components/common/Loader";
import { toast } from "react-hot-toast";

const SubmitProposal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfp, setRfp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRFP();
  }, [id]);

  const fetchRFP = async () => {
    try {
      const res = await rfpAPI.getById(id);
      console.log("Fetched RFP:", res.data);
      setRfp(res.data);
    } catch (err) {
      console.error("Error fetching RFP:", err);
      setError("Failed to load RFP details");
      toast.error("Failed to load RFP details");
    }
    setLoading(false);
  };

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError("");

    try {
      const response = await proposalAPI.submit(formData);

      // Success notification
      toast.success(
        "Proposal submitted successfully! The buyer has been notified via email."
      );

      // Redirect after short delay
      setTimeout(() => {
        navigate("/vendor/rfps");
      }, 2000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to submit proposal";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (!rfp) return <div className="p-4 text-center">RFP not found</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section - Responsive */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" onClick={() => navigate("/vendor/rfps")}>
          <ArrowLeft size={20} />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            Submit Proposal
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1 truncate">
            {rfp.title}
          </p>
        </div>
      </div>

      {/* Main Grid - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Proposal Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
              Proposal Details
            </h2>
            <ProposalForm
              rfpId={id}
              onSubmit={handleSubmit}
              onCancel={() => navigate("/vendor/rfps")}
              loading={submitting}
              error={error}
            />
          </div>
        </div>

        {/* Right Column - RFP Details Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* RFP Details Card */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
              RFP Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Title</p>
                <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                  {rfp.title}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">
                  Deadline
                </p>
                <p className="text-sm sm:text-base font-semibold text-gray-900">
                  {new Date(rfp.deadline).toLocaleDateString()}
                </p>
              </div>
              {rfp.budget && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">
                    Budget
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900">
                    ${rfp.budget.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
              Description
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm whitespace-pre-wrap">
              {rfp.description}
            </p>
          </div>

          {/* Requirements Card */}
          {rfp.requirements && (
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                Requirements
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm whitespace-pre-wrap">
                {rfp.requirements}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitProposal;
