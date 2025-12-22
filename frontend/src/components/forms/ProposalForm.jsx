import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import Button from "../common/Button";
import { useAuth } from "../../hooks/useAuth";

const ProposalForm = ({ rfpId, onSubmit, onCancel, loading, error }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    description: "",
    price: "",
    timeline: "",
    technicalApproach: "",
    deliverables: "",
    vendorName: user?.name || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Add vendor ID from auth context
    const submissionData = {
      ...formData,
      vendorId: user?._id || user?.id, // Adjust based on your user object
      rfpId: rfpId,
    };

    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vendor Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="vendorName"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Your company or name"
          value={formData.vendorName}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Proposal Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          required
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Provide an overview of your proposal..."
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proposed Price <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="price"
            required
            min="0"
            step="0.01"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="0.00"
            value={formData.price}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timeline(in Weeks)<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="timeline"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="e.g., 6 "
            value={formData.timeline}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Technical Approach <span className="text-red-500">*</span>
        </label>
        <textarea
          name="technicalApproach"
          required
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Describe your technical approach and methodology..."
          value={formData.technicalApproach}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deliverables <span className="text-red-500">*</span>
        </label>
        <textarea
          name="deliverables"
          required
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="List all deliverables and milestones..."
          value={formData.deliverables}
          onChange={handleChange}
        />
      </div>

      {/* Email notification info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          📧 <strong>Note:</strong> Upon submission, the buyer will
          automatically receive an email notification with your proposal
          details.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Proposal"}
        </Button>
      </div>
    </form>
  );
};

export default ProposalForm;
