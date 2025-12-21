import axios from "./axios";

export const rfpAPI = {
  getAll: async () => {
    const response = await axios.get("/rfps");
    return response.data;
  },

  getById: async (rfpId) => {
    const response = await axios.get(`/rfps/${rfpId}`);
    return response.data;
  },

  create: async (rfpData) => {
    const response = await axios.post("/rfps", rfpData);
    return response.data;
  },

  update: async (rfpId, rfpData) => {
    const response = await axios.put(`/rfps/${rfpId}`, rfpData);
    return response.data;
  },

  send: async (rfpId, vendorIds) => {
    const response = await axios.post(`/rfps/${rfpId}/send`, {
      vendorIds,
    });
    return response.data;
  },

  close: async (rfpId) => {
    const response = await axios.post(`/rfps/${rfpId}/close`);
    return response.data;
  },
};
