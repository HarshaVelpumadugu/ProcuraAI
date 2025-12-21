// api/proposal.api.js
import axios from "./axios";

export const proposalAPI = {
  submit: async (proposalData) => {
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user) {
        throw new Error("User not authenticated");
      }

      // ✅ Use vendorId for vendors, _id for backward compatibility
      const vendorId = user.vendorId;

      console.log("📝 Submitting proposal:");
      console.log("User:", user);
      console.log("Vendor ID:", vendorId);

      if (!vendorId) {
        throw new Error("Vendor ID not found. Please log in again.");
      }

      const payload = {
        rfp: proposalData.rfpId,
        vendor: vendorId, // ✅ Use the correct vendor ID
        coverLetter: proposalData.description,
        technicalProposal: proposalData.technicalApproach,
        pricing: {
          totalCost: parseFloat(proposalData.price),
          currency: "USD",
        },
        timeline: {
          duration: proposalData.timeline,
        },
        deliverables: proposalData.deliverables,
      };

      console.log("📤 Proposal payload:", payload);

      const response = await axios.post("/proposals", payload);
      return response.data;
    } catch (error) {
      console.error("❌ Error submitting proposal:", error);
      throw error;
    }
  },

  getMyProposals: async (params = {}) => {
    const response = await axios.get("/proposals/my-proposals", { params });
    return response.data;
  },

  getMyProposalById: async (proposalId) => {
    const response = await axios.get(`/proposals/my-proposals/${proposalId}`);
    return response.data;
  },

  // Update my proposal (vendor)
  updateMyProposal: async (proposalId, proposalData) => {
    const response = await axios.put(
      `/proposals/my-proposals/${proposalId}`,
      proposalData
    );
    return response.data;
  },

  // Withdraw my proposal (vendor)
  withdrawProposal: async (proposalId) => {
    const response = await axios.delete(
      `/proposals/my-proposals/${proposalId}`
    );
    return response.data;
  },

  getAll: async () => {
    const response = await axios.get("/proposals");
    return response.data;
  },

  getByRFP: async (rfpId) => {
    const response = await axios.get(`/rfps/${rfpId}/proposals`);
    return response.data;
  },

  getById: async (proposalId) => {
    const response = await axios.get(`/proposals/${proposalId}`);
    return response.data;
  },
};
