// features/vendor/proposals/SubmitProposal.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  FileText,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
  const [showRfpDetails, setShowRfpDetails] = useState(false);

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
  if (!rfp) return <div className="p-3 text-center text-sm">RFP not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-4 sm:pb-6 lg:pb-8">
      {/* Ultra Mobile-Optimized Header (320px+) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-4 mb-3 sm:mb-4 lg:mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            <button
              onClick={() => navigate("/vendor/rfps")}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 truncate">
                Submit Proposal
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5 truncate">
                {rfp.title}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Mobile: Collapsible RFP Details (320px optimized) */}
        <div className="lg:hidden mb-3 sm:mb-4">
          <button
            onClick={() => setShowRfpDetails(!showRfpDetails)}
            className="w-full bg-white rounded-lg shadow-sm p-3 sm:p-4 flex items-center justify-between border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <FileText
                size={16}
                className="text-blue-600 flex-shrink-0 sm:w-5 sm:h-5"
              />
              <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                RFP Details
              </span>
            </div>
            {showRfpDetails ? (
              <ChevronUp
                size={16}
                className="text-gray-400 flex-shrink-0 sm:w-5 sm:h-5"
              />
            ) : (
              <ChevronDown
                size={16}
                className="text-gray-400 flex-shrink-0 sm:w-5 sm:h-5"
              />
            )}
          </button>

          {showRfpDetails && (
            <div className="mt-2.5 sm:mt-3 space-y-2.5 sm:space-y-3 animate-in slide-in-from-top duration-200">
              {/* Quick Info Cards - Mobile Optimized for 320px */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3">
                <div className="bg-white rounded-lg shadow-sm p-2.5 sm:p-3 border border-gray-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar
                      size={14}
                      className="text-gray-400 flex-shrink-0"
                    />
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      Deadline
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 break-words">
                    {new Date(rfp.deadline).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "2-digit",
                    })}
                  </p>
                </div>
                {rfp.budget && (
                  <div className="bg-white rounded-lg shadow-sm p-2.5 sm:p-3 border border-gray-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      <DollarSign
                        size={14}
                        className="text-gray-400 flex-shrink-0"
                      />
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        Budget
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 break-words">
                      ${rfp.budget.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Description - Mobile Optimized */}
              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-1.5 sm:mb-2">
                  Description
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-600 whitespace-pre-wrap leading-relaxed break-words">
                  {rfp.description}
                </p>
              </div>

              {/* Requirements - Mobile Optimized */}
              {rfp.requirements && (
                <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-1.5 sm:mb-2">
                    Requirements
                  </h3>
                  <p className="text-[11px] sm:text-xs text-gray-600 whitespace-pre-wrap leading-relaxed break-words">
                    {rfp.requirements}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop/Tablet Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {/* Left Column - Proposal Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg p-3 sm:p-4 md:p-6 lg:p-8 border border-gray-200">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 md:mb-6">
                <Send
                  size={16}
                  className="text-blue-600 flex-shrink-0 sm:w-5 sm:h-5"
                />
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900">
                  Proposal Details
                </h2>
              </div>
              <ProposalForm
                rfpId={id}
                onSubmit={handleSubmit}
                onCancel={() => navigate("/vendor/rfps")}
                loading={submitting}
                error={error}
              />
            </div>
          </div>

          {/* Right Column - RFP Details Sidebar (Desktop/Tablet Only) */}
          <div className="hidden lg:block space-y-4 lg:space-y-5">
            {/* RFP Details Card */}
            <div className="bg-white rounded-xl shadow-lg p-5 lg:p-6 border border-gray-200 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={20} className="text-blue-600 flex-shrink-0" />
                <h3 className="text-lg font-bold text-gray-900">RFP Details</h3>
              </div>

              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100">
                  <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wide">
                    Title
                  </p>
                  <p className="text-sm font-semibold text-gray-900 break-words leading-snug">
                    {rfp.title}
                  </p>
                </div>

                <div className="pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Calendar
                      size={14}
                      className="text-gray-400 flex-shrink-0"
                    />
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Deadline
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(rfp.deadline).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {rfp.budget && (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <DollarSign
                        size={14}
                        className="text-gray-400 flex-shrink-0"
                      />
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Budget
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      ${rfp.budget.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-xl shadow-lg p-5 lg:p-6 border border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-3">
                Description
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {rfp.description}
              </p>
            </div>

            {/* Requirements Card */}
            {rfp.requirements && (
              <div className="bg-white rounded-xl shadow-lg p-5 lg:p-6 border border-gray-200">
                <h3 className="text-base font-bold text-gray-900 mb-3">
                  Requirements
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {rfp.requirements}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitProposal;
