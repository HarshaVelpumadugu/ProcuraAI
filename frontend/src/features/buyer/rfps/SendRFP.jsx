import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { rfpAPI } from "../../../api/rfp.api";
import { vendorAPI } from "../../../api/vendor.api";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";

const SendRFP = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await vendorAPI.getAll();
      setVendors(res.data.vendors);
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
    setLoading(false);
  };

  const toggleVendor = (vendorId) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSend = async () => {
    if (selectedVendors.length === 0) {
      alert("Please select at least one vendor");
      return;
    }

    setSending(true);
    try {
      console.log("Sending RFP to vendors:", selectedVendors);
      await rfpAPI.send(id, selectedVendors);
      alert("RFP sent successfully!");
      navigate(`/buyer/rfps/${id}`);
    } catch (err) {
      alert("Failed to send RFP");
      console.error("Error sending RFP:", err);
    }
    setSending(false);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" onClick={() => navigate(`/buyer/rfps/${id}`)}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            Send RFP
          </h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            Select vendors to receive this RFP
          </p>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 border border-slate-700">
        <div className="mb-4">
          <p className="text-sm text-slate-300">
            Selected:{" "}
            <span className="font-semibold text-white">
              {selectedVendors.length}
            </span>{" "}
            vendor(s)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {vendors.map((vendor) => (
            <div
              key={vendor._id}
              onClick={() => toggleVendor(vendor._id)}
              className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedVendors.includes(vendor._id)
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-600 hover:border-slate-500"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedVendors.includes(vendor._id)}
                  onChange={() => {}}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 accent-blue-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-sm sm:text-base truncate">
                    {vendor.name}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400 truncate">
                    {vendor.email}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/buyer/rfps/${id}`)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || selectedVendors.length === 0}
            className="w-full sm:w-auto"
          >
            <Send size={20} />
            {sending ? "Sending..." : "Send RFP"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SendRFP;
