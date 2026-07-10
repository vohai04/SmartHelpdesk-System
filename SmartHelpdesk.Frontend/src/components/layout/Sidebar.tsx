import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Ticket, Users, X } from "lucide-react";
import { useUiStore } from "../../store/uiStore";
import { useAuthStore } from "../../store/authStore";

export function Sidebar() {
  const location = useLocation();
  const { isSidebarOpen, setSidebarOpen } = useUiStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "Admin";

  const navItems = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard size={18} strokeWidth={2.2} /> },
    { name: "Tickets",   path: "/tickets", icon: <Ticket size={18} strokeWidth={2.2} /> },
    // Users: only visible to Admin
    ...(isAdmin ? [{ name: "Users", path: "/users", icon: <Users size={18} strokeWidth={2.2} /> }] : []),
  ];

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden transition-opacity"
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar panel */}
      <aside className="
        fixed inset-y-0 left-0 z-40 w-[240px] bg-[#FAFAFA] border-r border-slate-200 flex flex-col shadow-2xl
        md:relative md:z-auto md:shadow-none md:w-[240px]
      ">
        {/* Logo */}
        <div className="h-[var(--header-height,64px)] flex items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2z"/>
                <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>
              </svg>
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-slate-900">SmartDesk</span>
          </div>
          {/* Close button on mobile */}
          <button
            className="md:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                  className={`flex items-center px-3 py-2 rounded-md transition-all duration-150 gap-3 text-[13.5px] ${
                    isActive
                      ? "bg-slate-200/60 text-slate-900 font-medium"
                      : "text-slate-600 hover:bg-slate-200/40 hover:text-slate-900"
                  }`}
                >
                  <span className={isActive ? "text-slate-900" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User badge at bottom */}
        <div className="p-3 mb-2 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-200/40 transition-colors cursor-pointer border border-transparent">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-medium text-xs flex-shrink-0">
              {user?.fullName?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-900 truncate">{user?.fullName}</p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
