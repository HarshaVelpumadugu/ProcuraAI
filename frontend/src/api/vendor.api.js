import axios from "./axios";

export const vendorAPI = {
  getAll: async () => {
    const response = await axios.get("/vendors");
    console.log(response.data);
    return response.data;
  },

  getById: async (vendorId) => {
    const response = await axios.get(`/vendors/${vendorId}`);
    return response.data;
  },

  create: async (vendorData) => {
    const response = await axios.post("/vendors", vendorData);
    return response.data;
  },

  update: async (vendorId, vendorData) => {
    const response = await axios.put(`/vendors/${vendorId}`, vendorData);
    return response.data;
  },

  delete: async (vendorId) => {
    const response = await axios.delete(`/vendors/${vendorId}`);
    return response.data;
  },
};
