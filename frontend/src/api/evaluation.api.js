import axios from "./axios";

export const evaluationAPI = {
  compare: async (rfpId) => {
    const response = await axios.post(`/evaluation/${rfpId}/compare`);
    return response.data;
  },

  getRecommendation: async (rfpId) => {
    const response = await axios.get(`/evaluation/${rfpId}/recommendation`);
    return response.data;
  },
};
