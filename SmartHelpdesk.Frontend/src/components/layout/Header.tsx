import { Bell, Search, LogOut, User, Settings, Menu, ChevronDown } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/authService";
import { useNavigate, Link } from "react-router-dom";
import { useUiStore } from "../../store/uiStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function Header() {
  const { user, logout: storeLogout } = useAuthStore();
  const { toggleSidebar } = useUiStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    storeLogout();
    navigate("/auth/login");
  };

  const initials = user?.fullName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "U";

  return (
    <header className="h-[var(--header-height,56px)] bg-white border-b border-gray-200 flex items-center gap-3 px-4 flex-shrink-0 sticky top-0 z-[var(--z-header,100)]">
      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
        aria-label="Toggle sidebar"
      >
        <Menu size={17} />
      </button>

      {/* Search */}
      <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 flex-1 max-w-xs transition-all focus-within:bg-white focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-blue-500/15">
        <Search size={14} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search tickets, users..."
          className="bg-transparent text-[13px] text-gray-900 placeholder:text-gray-400 outline-none w-full"
        />
        <kbd className="hidden lg:inline-flex items-center text-[10px] text-gray-400 border border-gray-200 rounded px-1 py-0.5 font-mono">⌘K</kbd>
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <button className="relative p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
          <Bell size={17} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full ring-1 ring-white" />
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-100 transition-all outline-none group">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-700 group-hover:bg-gray-300 transition-colors">
                {initials}
              </div>
              <span className="hidden md:block text-[13px] font-medium text-gray-700 group-hover:text-gray-900 transition-colors max-w-[120px] truncate">
                {user?.fullName?.split(" ")[0] ?? "User"}
              </span>
              <ChevronDown size={12} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-[220px] mt-2 p-1.5">
            {/* User info header */}
            <div className="px-2 py-2 mb-1">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{user?.fullName}</p>
              <p className="text-[12px] text-gray-500 truncate mt-0.5">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem asChild className="cursor-pointer rounded-md text-[13px] gap-2 py-1.5">
              <Link to="/profile">
                <User size={14} className="text-gray-400" />
                View profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer rounded-md text-[13px] gap-2 py-1.5">
              <Link to="/settings">
                <Settings size={14} className="text-gray-400" />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer rounded-md text-[13px] gap-2 py-1.5 text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut size={14} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
