import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { List, MagnifyingGlass, User, Gear, SignOut, CaretDown } from "@phosphor-icons/react";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/authService";
import { useUiStore } from "../../store/uiStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { NotificationBell } from "./NotificationBell";
import { GlobalSearchModal } from "./GlobalSearchModal";

export function Header() {
  const { user, logout: storeLogout } = useAuthStore();
  const { toggleSidebar } = useUiStore();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    storeLogout();
    navigate("/auth/login");
  };

  const initials = (user?.fullName ?? "U")
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const firstName = user?.fullName?.split(" ")[0] ?? "User";

  return (
    <header
      className="flex items-center gap-3 px-5 flex-shrink-0"
      style={{
        height: "56px",
        background: "#ffffff",
        borderBottom: "1px solid #e7e5e4",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 flex-shrink-0"
        style={{ color: "#78716c" }}
        onMouseEnter={e => { e.currentTarget.style.background = "#f5f5f4"; e.currentTarget.style.color = "#18181b"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#78716c"; }}
      >
        <List size={18} weight="regular" />
      </button>

      {/* Search */}
      <button
        onClick={() => setSearchOpen(true)}
        className="hidden sm:flex items-center gap-2 flex-1 max-w-[280px] h-8 px-3 rounded-lg transition-all duration-150 text-left outline-none"
        style={{
          background: "#f5f5f4",
          border: "1px solid #e7e5e4",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.borderColor = "#2563eb";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "#f5f5f4";
          e.currentTarget.style.borderColor = "#e7e5e4";
        }}
        onFocus={e => {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.borderColor = "#2563eb";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
        }}
        onBlur={e => {
          e.currentTarget.style.background = "#f5f5f4";
          e.currentTarget.style.borderColor = "#e7e5e4";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <MagnifyingGlass size={13} weight="regular" style={{ color: "#a8a29e", flexShrink: 0 }} />
        <span className="flex-1 text-[13px] text-stone-400">
          Search tickets...
        </span>
        <kbd
          className="hidden lg:inline-flex items-center rounded text-[10px] px-1 py-0.5 font-mono flex-shrink-0"
          style={{ background: "#e7e5e4", color: "#a8a29e", border: "1px solid #d6d3d1" }}
        >
          ⌘K
        </kbd>
      </button>

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <NotificationBell />

        <div className="w-px h-4 mx-1" style={{ background: "#e7e5e4" }} />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-150 outline-none"
              style={{ color: "#57534e" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f5f5f4"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{ background: "#18181b", color: "#fff" }}
              >
                {initials}
              </div>
              <span className="hidden md:block text-[13px] font-medium" style={{ color: "#18181b" }}>
                {firstName}
              </span>
              <CaretDown size={11} weight="bold" style={{ color: "#a8a29e" }} />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="p-1.5 mt-1"
            style={{
              width: "210px",
              background: "#fff",
              border: "1px solid #e7e5e4",
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
              zIndex: 100,
            }}
          >
            {/* User info */}
            <div className="px-2.5 pt-2 pb-2">
              <p className="text-[13px] font-semibold truncate" style={{ color: "#18181b" }}>
                {user?.fullName}
              </p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: "#a8a29e" }}>
                {user?.email}
              </p>
            </div>

            <DropdownMenuSeparator
              className="my-1"
              style={{ background: "#f5f5f4", height: "1px", margin: "4px 0" }}
            />

            <DropdownMenuItem asChild>
              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] cursor-pointer transition-colors duration-100 outline-none"
                style={{ color: "#57534e" }}
              >
                <User size={14} weight="regular" style={{ color: "#a8a29e" }} />
                View profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                to="/settings"
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] cursor-pointer transition-colors duration-100 outline-none"
                style={{ color: "#57534e" }}
              >
                <Gear size={14} weight="regular" style={{ color: "#a8a29e" }} />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator
              className="my-1"
              style={{ background: "#f5f5f4", height: "1px", margin: "4px 0" }}
            />

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] cursor-pointer transition-colors duration-100 outline-none"
              style={{ color: "#dc2626" }}
            >
              <SignOut size={14} weight="regular" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <GlobalSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
