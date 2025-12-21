import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Auth
import Login from "../auth/Login";
import Register from "../auth/Register";

// Layouts
import BuyerLayout from "../layouts/BuyerLayout";
import VendorLayout from "../layouts/VendorLayout";

// Buyer Pages
import BuyerDashboard from "../features/buyer/dashboard/BuyerDashboard";
import RFPList from "../features/buyer/rfps/RFPList";
import CreateRFP from "../features/buyer/rfps/CreateRFP";
import RFPDetails from "../features/buyer/rfps/RFPDetails";
import SendRFP from "../features/buyer/rfps/SendRFP";
import VendorList from "../features/buyer/vendors/VendorList";
// import AddVendor from "../features/buyer/vendors/AddVendor";
// import EditVendor from "../features/buyer/vendors/EditVendor";
import ProposalList from "../features/buyer/proposals/ProposalList";
import ProposalDetails from "../features/buyer/proposals/ProposalDetails";
import CompareProposals from "../features/buyer/evaluation/CompareProposals";
import Recommendation from "../features/buyer/evaluation/Recommendation";

// Vendor Pages
import VendorDashboard from "../features/vendor/dashboard/VendorDashboard";
import AssignedRFPs from "../features/vendor/rfps/AssignedRFPs";
import SubmitProposal from "../features/vendor/proposals/SubmitProposal";
import ViewRFPDetails from "../features/vendor/rfps/ViewRFPDetails";
import VendorProposals from "../features/vendor/proposals/VendorProposals";
import VendorProposalDetail from "../features/vendor/proposals/VendorProposalDetail.jsx";

// Protected Route Component
import ProtectedRoute from "./ProtectedRoute";

const AppRouter = () => {
  const { isAuthenticated } = useAuth();
  console.log(isAuthenticated);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Buyer Routes */}
      <Route
        path="/buyer/*"
        element={
          <ProtectedRoute allowedRoles={["buyer", "admin"]}>
            <BuyerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<BuyerDashboard />} />
        <Route path="rfps" element={<RFPList />} />
        <Route path="rfps/create" element={<CreateRFP />} />
        <Route path="rfps/:id" element={<RFPDetails />} />
        <Route path="rfps/:id/send" element={<SendRFP />} />
        <Route path="vendors" element={<VendorList />} />
        <Route path="proposals" element={<ProposalList />} />
        <Route path="proposals/:id" element={<ProposalDetails />} />
        <Route path="rfps/:id/compare" element={<CompareProposals />} />
        <Route path="rfps/:id/recommendation" element={<Recommendation />} />
      </Route>

      {/* Vendor Routes */}
      <Route
        path="/vendor/*"
        element={
          <ProtectedRoute allowedRoles={["vendor"]}>
            <VendorLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<VendorDashboard />} />
        <Route path="rfps" element={<AssignedRFPs />} />
        <Route path="rfps/:id" element={<ViewRFPDetails />} />
        <Route path="rfps/:id/submit" element={<SubmitProposal />} />
        <Route path="proposals" element={<VendorProposals />} />
        <Route
          path="proposals/:proposalId"
          element={<VendorProposalDetail />}
        />
      </Route>

      {/* Default Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
