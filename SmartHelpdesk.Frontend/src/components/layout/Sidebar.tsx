import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Ticket, Users, ChevronRight } from "lucide-react";
import { useUiStore } from "../../store/uiStore";
import { useAuthStore } from "../../store/authStore";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) {
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
        isActive
          ? "bg-blue-50 text-blue-700 font-medium"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <span className={`flex-shrink-0 transition-colors ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}>
        {item.icon}
      </span>
      <span className="flex-1 truncate">{item.name}</span>
      {isActive && <ChevronRight size={12} className="text-blue-500 ml-auto flex-shrink-0" />}
    </Link>
  );
}

export function Sidebar() {
  const location = useLocation();
  const { isSidebarOpen, setSidebarOpen } = useUiStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "Admin";

  const navItems: NavItem[] = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard size={16} strokeWidth={2} /> },
    { name: "Tickets",   path: "/tickets", icon: <Ticket size={16} strokeWidth={2} /> },
    ...(isAdmin ? [{ name: "Users", path: "/users", icon: <Users size={16} strokeWidth={2} /> }] : []),
  ];

  const handleNavClick = () => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/25 z-30 md:hidden"
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className="
        fixed inset-y-0 left-0 z-40 flex flex-col
        w-[var(--sidebar-width,220px)] bg-white border-r border-gray-200
        md:relative md:z-auto
        animate-slide-in md:animate-none
      ">
        {/* Brand */}
        <div className="h-[var(--header-height,56px)] flex items-center px-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2z"/>
                <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>
              </svg>
            </div>
            <span className="font-semibold text-[14px] text-gray-900">SmartDesk</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
            Navigation
          </div>
          {navItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return <NavLink key={item.path} item={item} isActive={isActive} onClick={handleNavClick} />;
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-100 p-3 flex-shrink-0">
          <Link
            to="/profile"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
          >
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-semibold text-gray-700 flex-shrink-0 group-hover:bg-gray-300 transition-colors">
              {user?.fullName?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-gray-900 truncate">{user?.fullName ?? "User"}</p>
              <p className="text-[11px] text-gray-500 truncate">{user?.role}</p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
