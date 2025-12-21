export const API_BASE_URL = "http://localhost:5000/api";

export const USER_ROLES = {
  BUYER: "buyer",
  VENDOR: "vendor",
  ADMIN: "admin",
};

export const RFP_STATUS = {
  DRAFT: "draft",
  OPEN: "open",
  CLOSED: "closed",
};

export const PROPOSAL_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

export const DATE_FORMAT = "MMM DD, YYYY";

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  BUYER: {
    DASHBOARD: "/buyer/dashboard",
    RFPS: "/buyer/rfps",
    CREATE_RFP: "/buyer/rfps/create",
    VENDORS: "/buyer/vendors",
    PROPOSALS: "/buyer/proposals",
    EVALUATION: "/buyer/evaluation",
  },
  VENDOR: {
    DASHBOARD: "/vendor/dashboard",
    RFPS: "/vendor/rfps",
    PROPOSALS: "/vendor/proposals",
  },
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  NOT_FOUND: "Resource not found.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
};
