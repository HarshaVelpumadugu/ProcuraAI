import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { vendorAPI } from "../../../api/vendor.api";
import Button from "../../../components/common/Button";
import VendorForm from "../../../components/forms/VendorForm";
import Loader from "../../../components/common/Loader";

const EditVendor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVendor();
  }, [id]);

  const fetchVendor = async () => {
    try {
      const data = await vendorAPI.getById(id);
      setVendor(data);
    } catch (err) {
      console.error("Error fetching vendor:", err);
      setError("Failed to load vendor");
    }
    setLoading(false);
  };

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError("");
    try {
      await vendorAPI.update(id, formData);
      navigate("/buyer/vendors");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update vendor");
    }
    setSubmitting(false);
  };

  if (loading) return <Loader />;
  if (!vendor) return <div>Vendor not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/buyer/vendors")}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Vendor</h1>
          <p className="text-gray-500 mt-1">Update vendor information</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 max-w-2xl">
        <VendorForm
          initialData={vendor}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/buyer/vendors")}
          loading={submitting}
          error={error}
        />
      </div>
    </div>
  );
};

export default EditVendor;
