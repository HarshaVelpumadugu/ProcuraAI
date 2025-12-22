import React from "react";

const Sidebar = ({ items, activeItem, onItemClick, isOpen, onClose }) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
        fixed lg:sticky top-[64px] sm:top-[85px] lg:top-0 left-0 z-40
        w-72 lg:w-64 h-[calc(100vh-60px)] sm:h-[calc(100vh-64px)] lg:h-screen
        bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
        border-r border-slate-700
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <nav className="p-4 space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onItemClick(item.id);
                if (window.innerWidth < 1024) {
                  onClose();
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeItem === item.id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              {item.icon && <item.icon size={20} />}
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
