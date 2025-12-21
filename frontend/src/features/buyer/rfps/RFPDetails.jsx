import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, BarChart3, Award, Edit, Trash2 } from "lucide-react";
import { rfpAPI } from "../../../api/rfp.api";
import { proposalAPI } from "../../../api/proposal.api";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";

const RFPDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfp, setRfp] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRFPDetails();
  }, [id]);

  const fetchRFPDetails = async () => {
    try {
      const [rfpRes, proposalsRes] = await Promise.all([
        rfpAPI.getById(id),
        proposalAPI.getByRFP(id).catch(() => ({ data: [] })),
      ]);

      setRfp(rfpRes.data);
      setProposals(proposalsRes.data || []);
    } catch (err) {
      console.error("Error fetching RFP details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!rfp) return <div className="p-4 text-center">RFP not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/buyer/rfps")}>
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-xl font-bold text-white break-words">
              {rfp.title}
            </h1>
            <p className="text-white mt-1">RFP Details</p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          {/* <Button
            variant="outline"
            onClick={() => navigate(`/buyer/rfps/${id}/edit`)}
            className="flex-1 sm:flex-initial"
          >
            <Edit size={20} />
            Edit
          </Button> */}
          <Button
            variant="outline"
            onClick={() => navigate(`/buyer/rfps/${id}/send`)}
            className="flex-1 sm:flex-initial"
          >
            <Send size={20} />
            Send to Vendors
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
              Description
            </h2>
            <p className="text-sm sm:text-base text-gray-600 whitespace-pre-wrap">
              {rfp.description}
            </p>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
              Requirements
            </h2>
            <p className="text-sm sm:text-base text-gray-600 whitespace-pre-wrap">
              {rfp.requirements}
            </p>
          </div>

          {/* Proposals Section */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Received Proposals ({proposals.length})
              </h2>

              {/* Compare & Recommendation Buttons */}
              {proposals.length >= 2 && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    onClick={() => navigate(`/buyer/rfps/${id}/compare`)}
                    className="w-full sm:w-auto"
                  >
                    <BarChart3 size={16} />
                    Compare
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/buyer/rfps/${id}/recommendation`)}
                    className="w-full sm:w-auto"
                  >
                    <Award size={16} />
                    Recommendation
                  </Button>
                </div>
              )}
            </div>

            {proposals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No proposals received yet</p>
              </div>
            ) : proposals.length === 1 ? (
              <div className="space-y-3">
                {proposals.map((proposal) => (
                  <div key={proposal._id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 break-words">
                          {proposal.vendor?.company || proposal.vendor?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          ${proposal.pricing?.totalCost?.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(`/buyer/proposals/${proposal._id}`)
                        }
                        className="w-full sm:w-auto"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Need at least 2 proposals to use comparison and
                    recommendation features
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((proposal) => (
                  <div
                    key={proposal._id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 break-words">
                          {proposal.vendor?.company || proposal.vendor?.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-1">
                          <p className="text-sm text-gray-600">
                            ${proposal.pricing?.totalCost?.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {proposal.timeline?.duration || "N/A"}
                          </p>
                          {proposal.aiAnalysis?.complianceScore && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                              {proposal.aiAnalysis.complianceScore}/100
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(`/buyer/proposals/${proposal._id}`)
                        }
                        className="w-full sm:w-auto"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Key Info */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
              Key Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">
                  ${rfp.budget?.toLocaleString()} {rfp.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Deadline</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">
                  {new Date(rfp.deadline).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    rfp.status === "open"
                      ? "bg-green-100 text-green-700"
                      : rfp.status === "closed"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {rfp.status}
                </span>
              </div>
              {rfp.category && (
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">
                    {rfp.category}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          {proposals.length >= 2 && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-4 sm:p-6 border border-purple-200">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
                🤖 AI-Powered Analysis
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/buyer/rfps/${id}/compare`)}
                  className="w-full p-3 bg-white hover:bg-gray-50 rounded-lg text-left transition border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="text-blue-600" size={20} />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Compare All
                      </p>
                      <p className="text-xs text-gray-600">
                        Side-by-side analysis
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => navigate(`/buyer/rfps/${id}/recommendation`)}
                  className="w-full p-3 bg-white hover:bg-gray-50 rounded-lg text-left transition border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <Award className="text-purple-600" size={20} />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Get Recommendation
                      </p>
                      <p className="text-xs text-gray-600">
                        AI suggests best vendor
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RFPDetails;
