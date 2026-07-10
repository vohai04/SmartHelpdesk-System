import { Bell, Search, Settings, LogOut, User, Menu } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import { useUiStore } from "../../store/uiStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

  return (
    <header className="h-[var(--header-height,64px)] bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 sticky top-0 z-[var(--z-header,100)] gap-3 flex-shrink-0">
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors flex-shrink-0"
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Search bar — hidden on xs, visible from sm */}
      <div className="hidden sm:flex flex-1 items-center bg-[#FAFAFA] border border-slate-200 px-3 py-1.5 rounded-md gap-2 max-w-sm transition-colors focus-within:border-slate-300 focus-within:bg-white">
        <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent border-none outline-none text-[13px] w-full text-slate-900 placeholder:text-slate-400"
        />
      </div>

      {/* Spacer on xs */}
      <div className="flex-1 sm:hidden" />

      {/* Right icons */}
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
        {/* Mobile search icon */}
        <button className="sm:hidden p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
          <Search size={16} />
        </button>

        {/* Notifications */}
        <button className="relative p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-slate-900 rounded-full border border-white" />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-2" />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 cursor-pointer group outline-none p-1 rounded-md hover:bg-slate-50 transition-colors border border-transparent">
              <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-medium text-[11px] flex-shrink-0 group-hover:bg-slate-300 transition-colors">
                {user?.fullName?.charAt(0).toUpperCase() ?? "U"}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <div className="px-2 py-2 mb-1">
              <p className="text-[13px] font-medium text-slate-900 truncate">{user?.fullName}</p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2.5 text-slate-700">
              <User className="h-3.5 w-3.5 text-slate-400" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2.5 text-slate-700">
              <Settings className="h-3.5 w-3.5 text-slate-400" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-[#B91C1C] focus:text-[#B91C1C] focus:bg-[#FEF2F2] cursor-pointer gap-2.5 mt-1"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
