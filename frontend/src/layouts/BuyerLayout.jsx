import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Home, FileText, Users, Send, BarChart3 } from "lucide-react";
import Navbar from "../components/common/NavBar";
import Sidebar from "../components/common/SideBar";
import { logout } from "../auth/authSlice";

const BuyerLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeItem, setActiveItem] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      path: "/buyer/dashboard",
    },
    { id: "rfps", label: "RFPs", icon: FileText, path: "/buyer/rfps" },
    { id: "vendors", label: "Vendors", icon: Users, path: "/buyer/vendors" },
    {
      id: "proposals",
      label: "Proposals",
      icon: Send,
      path: "/buyer/proposals",
    },
  ];

  const handleMenuClick = (itemId) => {
    setActiveItem(itemId);
    const item = menuItems.find((i) => i.id === itemId);
    if (item?.path) {
      navigate(item.path);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-[60px] sm:pt-[64px]">
      <Navbar
        onLogout={handleLogout}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex">
        <Sidebar
          items={menuItems}
          activeItem={activeItem}
          onItemClick={handleMenuClick}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BuyerLayout;
