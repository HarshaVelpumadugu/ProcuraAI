import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  FileText,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
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

const VendorProposals = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await proposalAPI.getMyProposals();
      console.log("Fetched proposals:", response.data);
      setProposals(response.data.proposals || []);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      toast.error("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.rfp?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.vendor?.company
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || proposal.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "submitted":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "under_review":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "accepted":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getComplianceColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            My Proposals
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Track all your submitted proposals
          </p>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-2 sm:gap-4">
          <div className="bg-white rounded-lg px-3 py-2 sm:px-4 sm:py-3 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900">
              {proposals.length}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg px-3 py-2 sm:px-4 sm:py-3 shadow-sm border border-blue-200">
            <p className="text-xs text-blue-600">Pending</p>
            <p className="text-lg sm:text-xl font-bold text-blue-700">
              {
                proposals.filter(
                  (p) => p.status === "submitted" || p.status === "under_review"
                ).length
              }
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        {/* Search and Filter Bar */}
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search proposals..."
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Proposals List */}
        <div className="divide-y divide-gray-100">
          {filteredProposals.length > 0 ? (
            filteredProposals.map((proposal) => (
              <div
                key={proposal._id}
                className="p-4 sm:p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/vendor/proposals/${proposal._id}`)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 hidden sm:block">
                    {getStatusIcon(proposal.status)}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title and Status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                        {proposal.rfp?.title || "Untitled RFP"}
                      </h3>
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(
                          proposal.status
                        )}`}
                      >
                        {proposal.status?.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mt-3">
                      {/* Cost */}
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign
                          size={16}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <div>
                          <p className="text-xs text-gray-500">Your Bid</p>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(
                              proposal.pricing?.totalCost,
                              proposal.pricing?.currency
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Submitted Date */}
                      <div className="flex items-center gap-2 text-sm">
                        <Clock
                          size={16}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <div>
                          <p className="text-xs text-gray-500">Submitted</p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(proposal.submittedAt)}
                          </p>
                        </div>
                      </div>

                      {/* AI Score */}
                      {proposal.aiAnalysis?.complianceScore && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText
                            size={16}
                            className="text-gray-400 flex-shrink-0"
                          />
                          <div>
                            <p className="text-xs text-gray-500">AI Score</p>
                            <p
                              className={`font-semibold ${getComplianceColor(
                                proposal.aiAnalysis.complianceScore
                              )}`}
                            >
                              {proposal.aiAnalysis.complianceScore}/100
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Analysis Preview */}
                    {proposal.aiAnalysis?.summary && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-gray-500 mb-1">
                          AI Analysis
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {proposal.aiAnalysis.summary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* View Button */}
                  <div className="flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/vendor/proposals/${proposal._id}`);
                      }}
                    >
                      <Eye size={16} />
                      <span className="hidden sm:inline ml-2">View</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Proposals Yet
              </h3>
              <p className="text-gray-500 mb-4">
                You haven't submitted any proposals yet
              </p>
              <Button onClick={() => navigate("/vendor/rfps")}>
                View Available RFPs
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorProposals;
