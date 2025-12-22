import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Search,
  Filter,
  FileText,
  DollarSign,
  Clock,
  User,
} from "lucide-react";
import { rfpAPI } from "../../../api/rfp.api";
import { proposalAPI } from "../../../api/proposal.api";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";

const ProposalList = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await rfpAPI.getAll();
      const rfps = res.data.rfps || [];

      const proposalPromises = rfps.map(async (rfp) => {
        try {
          const propRes = await proposalAPI.getByRFP(rfp._id);
          return {
            rfpTitle: rfp.title,
            rfpId: rfp._id,
            // Based on your log, the proposals array is inside propRes.data
            proposals: propRes.data || [],
          };
        } catch (err) {
          return { rfpTitle: rfp.title, rfpId: rfp._id, proposals: [] };
        }
      });

      const results = await Promise.all(proposalPromises);
      console.log(results);

      // FLATTENING LOGIC
      const allProposals = results.flatMap((item) =>
        item.proposals.map((p) => ({
          ...p,
          rfpTitle: item.rfpTitle,
          rfpId: item.rfpId,
          // Mapping from your console.log data
          vendorName: p.vendor?.company || p.vendor?.name || "Unknown",
          displayPrice: p.pricing?.totalCost
            ? p.pricing.totalCost.toLocaleString()
            : "N/A",
          displayTimeline: p.timeline?.durationWeeks
            ? `${p.timeline.durationWeeks} Weeks`
            : "N/A",
        }))
      );

      setProposals(allProposals);
    } catch (err) {
      console.error("Aggregation Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter(
    (proposal) =>
      proposal.rfpTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Proposals
          </h1>
          <p className="text-sm sm:text-base text-white mt-1">
            Review submitted proposals
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter size={20} />
              Filter
            </Button>
          </div>
        </div>

        {/* Desktop Table View - Hidden on Mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  RFP
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Vendor
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Timeline
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Submitted
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProposals.map((proposal) => (
                <tr
                  key={proposal._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">
                      {proposal.rfpTitle}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {proposal.vendorName}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    ${proposal.displayPrice}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {proposal.displayTimeline || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(proposal.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          navigate(`/buyer/proposals/${proposal._id}`)
                        }
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Hidden on Desktop */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredProposals.map((proposal) => (
            <div
              key={proposal._id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 break-words">
                    {proposal.rfpTitle}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={14} className="flex-shrink-0" />
                    <span className="truncate">
                      {proposal.vendorName || "Unknown"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/buyer/proposals/${proposal._id}`)}
                  className="ml-2 p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors flex-shrink-0"
                  title="View Details"
                >
                  <Eye size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign
                    size={14}
                    className="text-green-600 flex-shrink-0"
                  />
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-medium text-gray-900">
                      ${proposal.displayPrice.toLocaleString() || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Timeline</p>
                    <p className="font-medium text-gray-900">
                      {proposal.displayTimeline || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Submitted:{" "}
                  {new Date(proposal.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProposals.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <FileText className="mx-auto text-gray-400 mb-4" size={40} />
            <p className="text-gray-500 text-base sm:text-lg">
              No proposals found
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalList;
