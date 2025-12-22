import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye, Send, Clock } from "lucide-react";
import { rfpAPI } from "../../../api/rfp.api";
import { proposalAPI } from "../../../api/proposal.api";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";

const AssignedRFPs = () => {
  const navigate = useNavigate();
  const [rfps, setRfps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedRFPIds, setSubmittedRFPIds] = useState([]);

  useEffect(() => {
    fetchRFPs();
  }, []);

  const fetchRFPs = async () => {
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const vendorId = user?.vendorId || user?._id || user?.id;

      const res = await rfpAPI.getAll();
      console.log("All RFPs:", res);

      let submittedRFPs = [];
      try {
        const proposalsRes = await proposalAPI.getAll();
        console.log("All proposals:", proposalsRes);
        if (proposalsRes.data) {
          submittedRFPs = proposalsRes.data
            .filter(
              (proposal) =>
                proposal.vendor?._id === vendorId ||
                proposal.vendor === vendorId
            )
            .map((proposal) => proposal.rfp?._id || proposal.rfp);
        }
      } catch (err) {
        console.error("Error fetching proposals:", err);
      }

      console.log("Submitted RFP IDs:", submittedRFPs);
      setSubmittedRFPIds(submittedRFPs);

      // Filter to show only open RFPs that don't have proposals from this vendor
      const assignedRFPs = res.data.rfps.filter(
        (rfp) => rfp.status === "open" && !submittedRFPs.includes(rfp._id)
      );

      console.log("Available RFPs (not submitted):", assignedRFPs.length);
      setRfps(assignedRFPs);
    } catch (err) {
      console.error("Error fetching RFPs:", err);
    }
    setLoading(false);
  };

  const filteredRFPs = rfps.filter(
    (rfp) =>
      rfp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDaysRemaining = (deadline) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section - Responsive */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Assigned RFPs
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            View and respond to RFPs assigned to you
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        {/* Search and Filter Bar - Responsive */}
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search RFPs..."
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter size={20} />
              Filter
            </Button>
          </div>
        </div>

        {/* RFP Cards Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
          {filteredRFPs.map((rfp) => {
            const daysRemaining = getDaysRemaining(rfp.deadline);
            return (
              <div
                key={rfp._id}
                className="bg-white rounded-xl border-2 border-gray-100 hover:border-blue-300 p-4 sm:p-6 transition-all hover:shadow-lg"
              >
                {/* Status Badges */}
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                  <div
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      daysRemaining > 7
                        ? "bg-green-100 text-green-700"
                        : daysRemaining > 3
                        ? "bg-orange-100 text-orange-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {daysRemaining} days left
                  </div>
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      rfp.status === "open"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {rfp.status}
                  </span>
                </div>

                {/* Title and Description */}
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 break-words">
                  {rfp.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">
                  {rfp.description}
                </p>

                {/* Deadline and Budget Info */}
                <div className="space-y-2 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                    <Clock size={14} className="flex-shrink-0" />
                    <span className="truncate">
                      Deadline: {new Date(rfp.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  {rfp.budget && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                      <span className="font-medium">Budget:</span>
                      <span>${rfp.budget.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs sm:text-sm"
                    onClick={() => navigate(`/vendor/rfps/${rfp._id}`)}
                  >
                    <Eye size={16} />
                    View
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs sm:text-sm"
                    onClick={() => navigate(`/vendor/rfps/${rfp._id}/submit`)}
                  >
                    <Send size={16} />
                    Submit
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredRFPs.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <Clock className="mx-auto text-gray-400 mb-4" size={40} />
            <p className="text-gray-500 text-base sm:text-lg">
              {rfps.length === 0 && submittedRFPIds.length === 0
                ? "No RFPs assigned yet"
                : "No open RFPs available. You've submitted proposals to all assigned RFPs."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedRFPs;
