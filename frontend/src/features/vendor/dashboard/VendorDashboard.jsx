import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Send, Clock, CheckCircle } from "lucide-react";
import { rfpAPI } from "../../../api/rfp.api";
import { proposalAPI } from "../../../api/proposal.api";
import Loader from "../../../components/common/Loader";
import Button from "../../../components/common/Button";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    assignedRFPs: 0,
    submittedProposals: 0,
    pendingRFPs: 0,
    wonProposals: 0,
  });
  const [recentRFPs, setRecentRFPs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get current vendor info
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const vendorId = user?.vendorId || user?._id || user?.id;

      console.log("Fetching dashboard data for vendor:", vendorId);

      // Fetch all RFPs
      const rfpRes = await rfpAPI.getAll();
      const allRFPs = rfpRes.data?.rfps || [];

      // Fetch all proposals by this vendor
      let vendorProposals = [];
      try {
        const proposalRes = await proposalAPI.getAll();
        vendorProposals = (proposalRes.data || []).filter(
          (proposal) =>
            proposal.vendor?._id === vendorId || proposal.vendor === vendorId
        );
        console.log("Vendor proposals:", vendorProposals);
      } catch (err) {
        console.error("Error fetching proposals:", err);
      }

      // Get submitted RFP IDs
      const submittedRFPIds = vendorProposals.map((p) => p.rfp?._id || p.rfp);

      // Calculate stats
      const openRFPs = allRFPs.filter((rfp) => rfp.status === "open");
      const availableRFPs = openRFPs.filter(
        (rfp) => !submittedRFPIds.includes(rfp._id)
      );
      const wonProposals = vendorProposals.filter(
        (p) => p.status === "accepted" || p.status === "awarded"
      );
      const pendingProposals = vendorProposals.filter(
        (p) => p.status === "submitted" || p.status === "under_review"
      );

      setStats({
        assignedRFPs: allRFPs.length,
        submittedProposals: vendorProposals.length,
        pendingRFPs: availableRFPs.length, // RFPs available to submit
        wonProposals: wonProposals.length,
      });

      console.log("Dashboard stats:", {
        total: allRFPs.length,
        submitted: vendorProposals.length,
        available: availableRFPs.length,
        won: wonProposals.length,
      });

      // Set recent RFPs (only ones without proposals)
      setRecentRFPs(availableRFPs.slice(0, 5));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
    setLoading(false);
  };

  const statCards = [
    {
      label: "Total RFPs",
      value: stats.assignedRFPs,
      icon: FileText,
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      label: "Submitted Proposals",
      value: stats.submittedProposals,
      icon: Send,
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      label: "Available to Submit",
      value: stats.pendingRFPs,
      icon: Clock,
      color: "orange",
      bgColor: "bg-orange-100",
      textColor: "text-orange-600",
    },
    {
      label: "Won Proposals",
      value: stats.wonProposals,
      icon: CheckCircle,
      color: "purple",
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
    },
  ];

  if (loading) return <Loader />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section - Responsive */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Vendor Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Welcome back! Here's your overview
          </p>
        </div>
      </div>

      {/* Stats Cards Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}
              >
                <stat.icon className={stat.textColor} size={20} />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              {stat.value}
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent RFPs and Quick Actions - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent RFPs */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Available RFPs
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/vendor/rfps")}
              className="text-blue-600 hover:text-blue-700"
            >
              View All
            </Button>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {recentRFPs.length > 0 ? (
              recentRFPs.map((rfp) => (
                <div
                  key={rfp._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer gap-2 sm:gap-0"
                  onClick={() => navigate(`/vendor/rfps/${rfp._id}/submit`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {rfp.title}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                      <p className="text-xs sm:text-sm text-gray-500">
                        Deadline: {new Date(rfp.deadline).toLocaleDateString()}
                      </p>
                      {rfp.budget && (
                        <p className="text-xs sm:text-sm text-gray-500">
                          Budget: ${rfp.budget.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="self-start sm:self-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-green-100 text-green-700">
                    Open
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8">
                <FileText className="mx-auto text-gray-400 mb-3" size={40} />
                <p className="text-gray-500 font-medium text-sm sm:text-base">
                  {stats.submittedProposals > 0
                    ? "Great job! You've submitted to all available RFPs"
                    : "No RFPs available yet"}
                </p>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  {stats.submittedProposals > 0
                    ? "Check back later for new opportunities"
                    : "RFPs sent to you will appear here"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={() => navigate("/vendor/rfps")}
              className="w-full p-3 sm:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="text-white" size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    View All RFPs
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {stats.pendingRFPs} opportunities available
                  </p>
                </div>
                {stats.pendingRFPs > 0 && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                    {stats.pendingRFPs}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => navigate("/vendor/proposals")}
              className="w-full p-3 sm:p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Send className="text-white" size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    My Proposals
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {stats.submittedProposals} proposals submitted
                  </p>
                </div>
                {stats.wonProposals > 0 && (
                  <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                    {stats.wonProposals} won
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Additional Stats Summary */}
          {stats.submittedProposals > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Performance Summary
              </h4>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Win Rate:</span>
                  <span className="font-semibold">
                    {stats.submittedProposals > 0
                      ? Math.round(
                          (stats.wonProposals / stats.submittedProposals) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Active Proposals:</span>
                  <span className="font-semibold">
                    {stats.submittedProposals - stats.wonProposals}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
