import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { vendorAPI } from "../../../api/vendor.api";
import Button from "../../../components/common/Button";
import VendorForm from "../../../components/forms/VendorForm";

const AddVendor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError("");
    try {
      await vendorAPI.create(formData);
      navigate("/buyer/vendors");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add vendor");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/buyer/vendors")}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Vendor</h1>
          <p className="text-gray-500 mt-1">Add a vendor to your directory</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 max-w-2xl">
        <VendorForm
          onSubmit={handleSubmit}
          onCancel={() => navigate("/buyer/vendors")}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default AddVendor;
