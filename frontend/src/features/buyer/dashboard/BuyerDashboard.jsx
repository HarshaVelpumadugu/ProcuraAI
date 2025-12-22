import React, { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  Users,
  Send,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Award,
  BarChart3,
} from "lucide-react";
import { rfpAPI } from "../../../api/rfp.api";
import { vendorAPI } from "../../../api/vendor.api";
import { proposalAPI } from "../../../api/proposal.api";
import { evaluationAPI } from "../../../api/evaluation.api";
import Loader from "../../../components/common/Loader";
import { Link } from "react-router-dom";

const BuyerDashboard = () => {
  const [stats, setStats] = useState({
    totalRFPs: 0,
    activeRFPs: 0,
    totalVendors: 0,
    totalProposals: 0,
    acceptedProposals: 0,
    evaluatedRFPs: 0,
    recommendedVendorsWon: 0,
  });
  const [recentRFPs, setRecentRFPs] = useState([]);
  const [recentProposals, setRecentProposals] = useState([]);
  const [recentEvaluations, setRecentEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const buyerId = user?._id || user?.id;

      const [rfpRes, vendorRes, proposalRes, evaluationRes] = await Promise.all(
        [
          rfpAPI.getAll(),
          vendorAPI.getAll(),
          proposalAPI.getAll().catch((err) => {
            console.error("Error fetching proposals:", err);
            return { data: [] };
          }),
          evaluationAPI.getAll().catch((err) => {
            console.error("Error fetching evaluations:", err);
            return { data: [] };
          }),
        ]
      );

      const rfps = rfpRes.data.rfps || [];
      const vendors = vendorRes.data?.vendors || vendorRes.data || [];
      const proposals = proposalRes.data || [];
      const evaluations = evaluationRes.data || [];

      const buyerRFPs = rfps.filter(
        (rfp) => rfp.createdBy?._id === buyerId || rfp.createdBy === buyerId
      );

      const buyerRFPIds = buyerRFPs.map((rfp) => rfp._id);

      const buyerProposals = proposals.filter((proposal) =>
        buyerRFPIds.includes(proposal.rfp?._id || proposal.rfp)
      );

      const buyerEvaluations = evaluations.filter((evaluation) =>
        buyerRFPIds.includes(evaluation.rfp?._id || evaluation.rfp)
      );

      const pendingProposals = buyerProposals.filter(
        (p) => p.status === "submitted" || p.status === "under_review"
      );
      const acceptedProposals = buyerProposals.filter(
        (p) => p.status === "accepted" || p.status === "awarded"
      );
      const evaluatedRFPs = buyerEvaluations.filter(
        (e) => e.status === "completed" && e.recommendation
      ).length;

      let recommendedVendorsWon = 0;

      console.log("Buyer evaluations:", buyerEvaluations.length);

      for (const evaluation of buyerEvaluations) {
        if (evaluation.recommendation && evaluation.status === "completed") {
          try {
            const recommendation = JSON.parse(evaluation.recommendation);
            const topPick = recommendation.recommendations?.top_pick;
            if (!topPick) {
              continue;
            }
            const recommendedProposalIndex = topPick.proposal_id;
            const recommendedVendorName = topPick.vendor;
            const rfpId = (evaluation.rfp?._id || evaluation.rfp).toString();
            const rfpProposals = buyerProposals.filter((p) => {
              const proposalRfpId = (p.rfp?._id || p.rfp).toString();
              return proposalRfpId === rfpId;
            });

            console.log(
              `Found ${rfpProposals.length} proposals for RFP ${rfpId}`
            );

            // Find the recommended proposal by matching vendor name OR proposal index
            const recommendedProposal = rfpProposals.find((p, index) => {
              // Get vendor name - handle both populated and unpopulated cases
              let vendorName = "";
              if (typeof p.vendor === "object" && p.vendor !== null) {
                vendorName = p.vendor.company || p.vendor.name || "";
              }

              const matchesVendor =
                vendorName &&
                vendorName.toLowerCase() ===
                  recommendedVendorName.toLowerCase();
              const matchesIndex = index + 1 === recommendedProposalIndex; // proposal_id is 1-indexed

              const isAcceptedOrAwarded =
                p.status === "accepted" || p.status === "awarded";
              return (matchesVendor || matchesIndex) && isAcceptedOrAwarded;
            });

            if (recommendedProposal) {
              recommendedVendorsWon++;
              console.log("Recommended vendor won this RFP!");
            } else {
              console.log("Recommended vendor did not win this RFP");
            }
          } catch (err) {
            console.error("Error parsing recommendation:", err);
          }
        }
      }

      console.log(`Total recommendations followed: ${recommendedVendorsWon}`);

      setStats({
        totalRFPs: buyerRFPs.length,
        activeRFPs: buyerRFPs.filter((r) => r.status === "open").length,
        totalVendors: vendors.length,
        totalProposals: buyerProposals.length,
        acceptedProposals: acceptedProposals.length,
        evaluatedRFPs: evaluatedRFPs,
        recommendedVendorsWon: recommendedVendorsWon,
      });
      const sortedRFPs = buyerRFPs
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentRFPs(sortedRFPs);
      const sortedEvaluations = buyerEvaluations
        .filter((e) => e.status === "completed")
        .sort(
          (a, b) => new Date(b.lastEvaluatedAt) - new Date(a.lastEvaluatedAt)
        )
        .slice(0, 3);
      setRecentEvaluations(sortedEvaluations);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: "Total RFPs",
      value: stats.totalRFPs,
      icon: FileText,
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      label: "Active RFPs",
      value: stats.activeRFPs,
      icon: Clock,
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      label: "Total Vendors",
      value: stats.totalVendors,
      icon: Users,
      color: "purple",
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
    },
    {
      label: "Total Proposals",
      value: stats.totalProposals,
      icon: Send,
      color: "orange",
      bgColor: "bg-orange-100",
      textColor: "text-orange-600",
    },
  ];

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Here's your overview
          </p>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}
              >
                <stat.icon className={stat.textColor} size={24} />
              </div>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Evaluation & Recommendation Stats */}
      {stats.evaluatedRFPs > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <BarChart3 className="text-indigo-600" size={20} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats.evaluatedRFPs}
                </h3>
                <p className="text-sm text-gray-500">RFPs Evaluated</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    stats.totalRFPs > 0
                      ? (stats.evaluatedRFPs / stats.totalRFPs) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.totalRFPs > 0
                ? Math.round((stats.evaluatedRFPs / stats.totalRFPs) * 100)
                : 0}
              % of all RFPs
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Award className="text-emerald-600" size={20} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats.recommendedVendorsWon}
                </h3>
                <p className="text-sm text-gray-500">
                  Recommendations Followed
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    stats.evaluatedRFPs > 0
                      ? (stats.recommendedVendorsWon / stats.evaluatedRFPs) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.evaluatedRFPs > 0
                ? Math.round(
                    (stats.recommendedVendorsWon / stats.evaluatedRFPs) * 100
                  )
                : 0}
              % success rate
            </p>
          </div>
        </div>
      )}

      {/* Secondary Stats - Proposals Breakdown */}
      {stats.totalProposals > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats.acceptedProposals}
                </h3>
                <p className="text-sm text-gray-500">Accepted Proposals</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    stats.totalProposals > 0
                      ? (stats.acceptedProposals / stats.totalProposals) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent RFPs */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Recent RFPs</h3>
            <Link
              to="/buyer/rfps"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentRFPs.length > 0 ? (
              recentRFPs.map((rfp) => (
                <Link
                  key={rfp._id}
                  to={`/buyer/rfps/${rfp._id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {rfp.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-gray-500">
                        {new Date(rfp.createdAt).toLocaleDateString()}
                      </p>
                      {rfp.budget && (
                        <p className="text-sm text-gray-500">
                          ${rfp.budget.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                      rfp.status === "open"
                        ? "bg-green-100 text-green-700"
                        : rfp.status === "closed"
                        ? "bg-red-100 text-red-700"
                        : rfp.status === "awarded"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {rfp.status}
                  </span>
                </Link>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto text-gray-400 mb-3" size={40} />
                <p className="text-gray-500 font-medium">No RFPs yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Create your first RFP to get started
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Proposals */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Recent Proposals
            </h3>
            <Link
              to="/buyer/proposals"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentProposals.length > 0 ? (
              recentProposals.map((proposal) => (
                <div
                  key={proposal._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/buyer/proposals/${proposal._id}`)
                  }
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {proposal.vendor?.company ||
                        proposal.vendor?.name ||
                        "Unknown Vendor"}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-gray-500">
                        ${proposal.pricing?.totalCost?.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(proposal.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                      proposal.status === "submitted" ||
                      proposal.status === "under_review"
                        ? "bg-yellow-100 text-yellow-700"
                        : proposal.status === "accepted" ||
                          proposal.status === "awarded"
                        ? "bg-green-100 text-green-700"
                        : proposal.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {proposal.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Send className="mx-auto text-gray-400 mb-3" size={40} />
                <p className="text-gray-500 font-medium">No proposals yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Proposals will appear here once vendors respond
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/buyer/rfps/create"
            className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Create New RFP</p>
                <p className="text-sm text-gray-500">
                  Start a new request for proposal
                </p>
              </div>
            </div>
          </Link>
          <Link
            to="/buyer/vendors"
            className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Manage Vendors</p>
                <p className="text-sm text-gray-500">
                  {stats.totalVendors} vendors registered
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
