import React from "react";
import { Bell, LogOut, FileText, Menu, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const Navbar = ({ onLogout, onMenuToggle, isMobileMenuOpen }) => {
  const { user } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 fixed top-0 left-0 right-0 z-50 shadow-xl">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <X size={24} className="text-white" />
              ) : (
                <Menu size={24} className="text-white" />
              )}
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="text-white" size={20} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-white">
                RFP Manager
              </h1>
              <p className="text-xs text-slate-400">
                {user?.role === "buyer"
                  ? "Buyer Portal"
                  : user?.role === "vendor"
                  ? "Vendor Portal"
                  : "Admin Portal"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors relative">
              <Bell size={18} className="text-slate-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
            </button> */}

            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-700">
              <div className="hidden sm:block text-right">
                <p className="font-semibold text-white text-sm">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-slate-400 capitalize">
                  {user?.role || "Guest"}
                </p>
              </div>
              <button
                onClick={onLogout}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
