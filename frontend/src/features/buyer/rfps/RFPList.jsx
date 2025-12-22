import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Eye } from "lucide-react";
import { rfpAPI } from "../../../api/rfp.api";
import { proposalAPI } from "../../../api/proposal.api";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";

const RFPList = () => {
  const navigate = useNavigate();
  const [rfps, setRfps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [proposalCounts, setProposalCounts] = useState({});

  useEffect(() => {
    fetchRFPs();
  }, []);

  const fetchRFPs = async () => {
    try {
      const res = await rfpAPI.getAll();
      const rfpList = res.data.rfps;
      setRfps(rfpList);
      console.log("Fetched RFPs:", rfpList);

      // Fetch proposal counts for each RFP
      await fetchProposalCounts(rfpList);
    } catch (err) {
      console.error("Error fetching RFPs:", err);
    }
    setLoading(false);
  };

  const fetchProposalCounts = async (rfpList) => {
    try {
      // Fetch proposals for all RFPs in parallel
      const proposalPromises = rfpList.map((rfp) =>
        proposalAPI.getByRFP(rfp._id).catch(() => ({ data: [] }))
      );

      const proposalResults = await Promise.all(proposalPromises);

      // Create a map of RFP ID to proposal count
      const counts = {};
      rfpList.forEach((rfp, index) => {
        counts[rfp._id] = proposalResults[index]?.data?.length || 0;
      });

      setProposalCounts(counts);
      console.log("Proposal counts:", counts);
    } catch (err) {
      console.error("Error fetching proposal counts:", err);
    }
  };

  const filteredRFPs = rfps.filter(
    (rfp) =>
      rfp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            RFPs
          </h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            Manage your requests for proposals
          </p>
        </div>
        <Button
          onClick={() => navigate("/buyer/rfps/create")}
          className="w-full sm:w-auto"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Create RFP</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700">
        <div className="p-4 sm:p-6 border-b border-slate-700">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search RFPs..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
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

        {filteredRFPs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm sm:text-base">
              {searchTerm
                ? "No RFPs found matching your search"
                : "No RFPs yet"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Deadline
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Proposals
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredRFPs.map((rfp) => (
                    <tr
                      key={rfp._id}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-white">
                            {rfp.title}
                          </p>
                          <p className="text-sm text-slate-400 line-clamp-1">
                            {rfp.description?.substring(0, 50)}
                            {rfp.description?.length > 50 ? "..." : ""}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            rfp.status === "open"
                              ? "bg-green-500/20 text-green-400"
                              : rfp.status === "closed"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-slate-500/20 text-slate-400"
                          }`}
                        >
                          {rfp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {new Date(rfp.deadline).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {/* Use proposalCounts instead of rfp.proposals */}
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-blue-500/20 text-blue-400 rounded-full font-semibold">
                          {proposalCounts[rfp._id] || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/buyer/rfps/${rfp._id}`)}
                            className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-400 transition-colors"
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

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-slate-700">
              {filteredRFPs.map((rfp) => (
                <div
                  key={rfp._id}
                  onClick={() => navigate(`/buyer/rfps/${rfp._id}`)}
                  className="p-4 hover:bg-slate-700/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white text-sm sm:text-base flex-1 pr-2">
                      {rfp.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                        rfp.status === "open"
                          ? "bg-green-500/20 text-green-400"
                          : rfp.status === "closed"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-slate-500/20 text-slate-400"
                      }`}
                    >
                      {rfp.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                    {rfp.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Deadline: {new Date(rfp.deadline).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      Proposals:{" "}
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-blue-500/20 text-blue-400 rounded-full font-semibold text-xs">
                        {proposalCounts[rfp._id] || 0}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RFPList;
