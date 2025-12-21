import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, X, Clock, DollarSign, FileText } from "lucide-react";
import { rfpAPI } from "../../../api/rfp.api";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";

const ViewRFPDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfp, setRfp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRFPDetails();
  }, [id]);

  const fetchRFPDetails = async () => {
    try {
      const res = await rfpAPI.getById(id);
      console.log(res.data);
      setRfp(res.data);
    } catch (err) {
      console.error("Error fetching RFP details:", err);
    }
    setLoading(false);
  };

  const handleCloseRFP = async () => {
    if (window.confirm("Are you sure you want to close this RFP?")) {
      try {
        await rfpAPI.close(id);
        fetchRFPDetails();
      } catch (err) {
        console.error("Error closing RFP:", err);
      }
    }
  };

  if (loading) return <Loader />;
  if (!rfp) return <div className="text-white">RFP not found</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button variant="ghost" onClick={() => navigate("/vendor/rfps")}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
              {rfp.title}
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              RFP Details
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/buyer/rfps/${id}/send`)}
            className="w-full sm:w-auto text-sm"
          >
            <Send size={18} />
            <span className="hidden sm:inline">Send to Vendors</span>
            <span className="sm:hidden">Send</span>
          </Button>
          {rfp.status === "open" && (
            <Button
              variant="danger"
              onClick={handleCloseRFP}
              className="w-full sm:w-auto text-sm"
            >
              <X size={18} />
              <span className="hidden sm:inline">Close RFP</span>
              <span className="sm:hidden">Close</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 border border-slate-700">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
              Description
            </h2>
            <p className="text-slate-300 whitespace-pre-wrap text-sm sm:text-base">
              {rfp.description}
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 border border-slate-700">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
              Requirements
            </h2>
            <p className="text-slate-300 whitespace-pre-wrap text-sm sm:text-base">
              {rfp.requirements || "No specific requirements listed"}
            </p>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 border border-slate-700">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
              Details
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="text-blue-400" size={18} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-400">Status</p>
                  <p className="font-semibold text-white capitalize text-sm sm:text-base">
                    {rfp.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="text-green-400" size={18} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-400">Deadline</p>
                  <p className="font-semibold text-white text-sm sm:text-base">
                    {new Date(rfp.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {rfp.budget && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="text-purple-400" size={18} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-400">Budget</p>
                    {rfp.budget != null && (
                      <p className="font-semibold text-white text-sm sm:text-base">
                        ${rfp.budget}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="text-orange-400" size={18} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-400">Proposals</p>
                  <p className="font-semibold text-white text-sm sm:text-base">
                    {rfp.proposals?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button
            fullWidth
            onClick={() => navigate(`/buyer/evaluation/${id}/compare`)}
            disabled={!rfp.proposals || rfp.proposals.length === 0}
          >
            Compare Proposals
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewRFPDetails;
