import { Link, useLocation } from "react-router-dom";
import { SquaresFour, Ticket, Users, Tag } from "@phosphor-icons/react";
import { useUiStore } from "../../store/uiStore";
import { useAuthStore } from "../../store/authStore";

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

export function Sidebar() {
  const location = useLocation();
  const { isSidebarOpen, setSidebarOpen } = useUiStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "Admin";

  const navItems: NavItem[] = [
    { name: "Dashboard", path: "/",        icon: SquaresFour },
    { name: "Tickets",   path: "/tickets", icon: Ticket },
    ...(isAdmin ? [
      { name: "Users", path: "/users", icon: Users },
      { name: "Categories", path: "/admin/categories", icon: Tag }
    ] : []),
  ];

  const initials = (user?.fullName ?? "U")
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // On mobile: hidden when closed. On desktop: always visible but changes width.
  const sidebarClasses = [
    // Position
    "fixed top-0 left-0 h-full z-50 flex flex-col",
    // Mobile: slide in/out
    "max-md:" + (isSidebarOpen ? "translate-x-0" : "-translate-x-full"),
    // Desktop: always show, relative positioning handled by flex parent
    "md:relative md:translate-x-0 md:flex md:flex-shrink-0",
    // Transition
    "transition-all duration-300 ease-in-out",
  ].join(" ");

  return (
    <aside
      className={sidebarClasses}
      style={{
        width: isSidebarOpen ? "220px" : "64px",
        background: "#ffffff",
        borderRight: "1px solid #e7e5e4",
        boxShadow: isSidebarOpen ? "4px 0 24px rgba(0,0,0,0.06)" : "none",
        overflow: "hidden"
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center px-4 flex-shrink-0"
        style={{
          height: "56px",
          borderBottom: "1px solid #f5f5f4",
        }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "#18181b" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2z"/>
            <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>
          </svg>
        </div>
        <span
          className={`ml-2.5 font-semibold text-[14px] tracking-tight transition-opacity duration-200 whitespace-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}
          style={{ color: "#18181b" }}
        >
          SmartDesk
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col items-center md:items-stretch">
        <p
          className={`px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}
          style={{ color: "#a8a29e" }}
        >
          Menu
        </p>

        <div className="space-y-1 w-full">
          {navItems.map(({ name, path, icon: Icon }) => {
            const isActive =
              location.pathname === path ||
              (path !== "/" && location.pathname.startsWith(path));

            return (
              <Link
                key={path}
                to={path}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
                title={!isSidebarOpen ? name : undefined}
                className={`flex items-center ${isSidebarOpen ? 'gap-2.5 px-2.5' : 'justify-center'} py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group w-full`}
                style={{
                  background: isActive ? "#eff6ff" : "transparent",
                  color:      isActive ? "#2563eb" : "#57534e",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#fafaf9";
                    e.currentTarget.style.color = "#18181b";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#57534e";
                  }
                }}
              >
                <Icon
                  size={isSidebarOpen ? 16 : 20}
                  weight={isActive ? "fill" : "regular"}
                  style={{ color: isActive ? "#2563eb" : "#a8a29e", flexShrink: 0 }}
                />
                <span className={`transition-opacity duration-200 whitespace-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  {name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User footer */}
      <div
        className="p-2 flex-shrink-0"
        style={{ borderTop: "1px solid #f5f5f4" }}
      >
        <Link
          to="/profile"
          className={`flex items-center ${isSidebarOpen ? 'gap-2.5 px-2.5' : 'justify-center'} py-2 rounded-lg transition-all duration-150`}
          style={{ color: "#57534e" }}
          title={!isSidebarOpen ? user?.fullName || "Profile" : undefined}
          onMouseEnter={e => { e.currentTarget.style.background = "#fafaf9"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: "#e7e5e4", color: "#57534e" }}
          >
            {initials}
          </div>
          <div className={`min-w-0 flex-1 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
            <p className="text-[12px] font-semibold truncate" style={{ color: "#18181b" }}>
              {user?.fullName ?? "User"}
            </p>
            <p className="text-[11px] truncate" style={{ color: "#a8a29e" }}>
              {user?.role}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
