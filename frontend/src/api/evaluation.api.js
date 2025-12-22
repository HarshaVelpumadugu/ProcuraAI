// api/evaluation.api.js
import axios from "./axios";

export const evaluationAPI = {
  getAll: async () => {
    const response = await axios.get("/evaluation");
    return response.data;
  },
  compare: async (rfpId) => {
    const response = await axios.post(`/evaluation/${rfpId}/compare`);
    return response.data;
  },
  getRecommendation: async (rfpId) => {
    const response = await axios.get(`/evaluation/${rfpId}/recommendation`);
    return response.data;
  },
};
