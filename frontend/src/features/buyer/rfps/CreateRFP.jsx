import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { rfpAPI } from "../../../api/rfp.api";
import Button from "../../../components/common/Button";
import RFPForm from "../../../components/forms/RFPForm";

const CreateRFP = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError("");
    try {
      const result = await rfpAPI.create(formData);
      console.log("Form submitted successfully:", result.data);
      navigate(`/buyer/rfps/${result.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create RFP");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" onClick={() => navigate("/buyer/rfps")}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            Create New RFP
          </h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            Fill in the details for your request for proposal
          </p>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 border border-slate-700">
        <RFPForm
          onSubmit={handleSubmit}
          onCancel={() => navigate("/buyer/rfps")}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default CreateRFP;
