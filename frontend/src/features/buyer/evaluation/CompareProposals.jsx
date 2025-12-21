import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { evaluationAPI } from "../../../api/evaluation.api";
import { proposalAPI } from "../../../api/proposal.api";
import { rfpAPI } from "../../../api/rfp.api";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";

const CompareProposals = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comparison, setComparison] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [rfp, setRfp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [rfpData, proposalsData] = await Promise.all([
        rfpAPI.getById(id),
        proposalAPI.getByRFP(id),
      ]);
      console.log("Fetched RFP Data:", rfpData);
      console.log("Fetched Proposals Data:", proposalsData.data);

      // FIXED: Access nested data correctly
      setRfp(rfpData.data);
      setProposals(proposalsData.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
    setLoading(false);
  };

  const handleCompare = async () => {
    setComparing(true);
    try {
      const result = await evaluationAPI.compare(id);
      setComparison(result);
    } catch (err) {
      console.error("Error comparing proposals:", err);
      alert("Failed to compare proposals");
    }
    setComparing(false);
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/buyer/rfps/${id}`)}
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Compare Proposals
              </h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                {rfp?.title}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCompare}
              disabled={comparing || proposals.length === 0}
            >
              <TrendingUp size={20} />
              {comparing ? "Analyzing..." : "Run Comparison"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/buyer/rfps/${id}/recommendation`)}
            >
              View Recommendation
            </Button>
          </div>
        </div>

        {/* No Proposals State */}
        {proposals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
            <p className="text-gray-500 text-lg">No proposals submitted yet</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View - Hidden on mobile/tablet */}
            <div className="hidden lg:block bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                      Criteria
                    </th>
                    {proposals.map((proposal, idx) => (
                      <th
                        key={proposal._id}
                        className="px-6 py-4 text-left text-sm font-semibold text-gray-900"
                      >
                        {/* FIXED: Access vendor.name or vendor.company */}
                        {proposal.vendor?.name ||
                          proposal.vendor?.company ||
                          `Vendor ${idx + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 bg-white z-10">
                      Company
                    </td>
                    {proposals.map((proposal) => (
                      <td
                        key={proposal._id}
                        className="px-6 py-4 text-gray-600"
                      >
                        {proposal.vendor?.company || "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 bg-white z-10">
                      Price
                    </td>
                    {proposals.map((proposal) => (
                      <td
                        key={proposal._id}
                        className="px-6 py-4 text-gray-600"
                      >
                        {/* FIXED: Access pricing.totalCost instead of price */}
                        $
                        {proposal.pricing?.totalCost?.toLocaleString() || "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 bg-white z-10">
                      Timeline
                    </td>
                    {proposals.map((proposal) => (
                      <td
                        key={proposal._id}
                        className="px-6 py-4 text-gray-600"
                      >
                        {/* FIXED: Access timeline.durationWeeks */}
                        {proposal.timeline?.durationWeeks
                          ? `${proposal.timeline.durationWeeks} weeks`
                          : "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 bg-white z-10">
                      Compliance Score
                    </td>
                    {proposals.map((proposal) => (
                      <td
                        key={proposal._id}
                        className="px-6 py-4 text-gray-600"
                      >
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            proposal.aiAnalysis?.complianceScore >= 95
                              ? "bg-green-100 text-green-800"
                              : proposal.aiAnalysis?.complianceScore >= 85
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {proposal.aiAnalysis?.complianceScore || "N/A"}%
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 bg-white z-10">
                      Submitted Date
                    </td>
                    {proposals.map((proposal) => (
                      <td
                        key={proposal._id}
                        className="px-6 py-4 text-gray-600"
                      >
                        {new Date(proposal.submittedAt).toLocaleDateString()}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 bg-white z-10">
                      Cover Letter
                    </td>
                    {proposals.map((proposal) => (
                      <td
                        key={proposal._id}
                        className="px-6 py-4 text-gray-600 max-w-xs"
                      >
                        {/* FIXED: Access coverLetter instead of description */}
                        <p className="line-clamp-2">
                          {proposal.coverLetter || "N/A"}
                        </p>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View - Shown on small/medium screens */}
            <div className="lg:hidden space-y-4">
              {proposals.map((proposal, idx) => (
                <div
                  key={proposal._id}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {proposal.vendor?.name ||
                          proposal.vendor?.company ||
                          `Vendor ${idx + 1}`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {proposal.vendor?.company}
                      </p>
                    </div>
                    {proposal.aiAnalysis?.complianceScore && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          proposal.aiAnalysis.complianceScore >= 95
                            ? "bg-green-100 text-green-800"
                            : proposal.aiAnalysis.complianceScore >= 85
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {proposal.aiAnalysis.complianceScore}%
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">
                        Price
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        $
                        {proposal.pricing?.totalCost?.toLocaleString() || "N/A"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">
                        Timeline
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {proposal.timeline?.durationWeeks
                          ? `${proposal.timeline.durationWeeks} weeks`
                          : "N/A"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">
                        Submitted
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(proposal.submittedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="pt-2">
                      <span className="text-sm font-medium text-gray-500 block mb-2">
                        Cover Letter
                      </span>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {proposal.coverLetter || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Analysis Results */}
        {comparison && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 sm:p-8 border border-blue-100">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Analysis Results
            </h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                {comparison.summary || "Comparison completed successfully"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareProposals;
