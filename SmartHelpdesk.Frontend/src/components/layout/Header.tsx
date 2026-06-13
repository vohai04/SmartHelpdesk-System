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
import { Avatar, AvatarFallback } from "../ui/avatar";

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
    <header className="h-[var(--header-height,64px)] bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 sticky top-0 z-[var(--z-header,100)] gap-3 flex-shrink-0">
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Search bar — hidden on xs, visible from sm */}
      <div className="hidden sm:flex flex-1 items-center bg-slate-100 px-3 py-2 rounded-lg gap-2 max-w-md">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search tickets, users..."
          className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
        />
      </div>

      {/* Spacer on xs */}
      <div className="flex-1 sm:hidden" />

      {/* Right icons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Mobile search icon */}
        <button className="sm:hidden p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
          <Search size={18} />
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* Settings — hidden on mobile */}
        <button className="hidden sm:flex p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
          <Settings size={18} />
        </button>

        <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1" />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer group outline-none">
              <Avatar className="h-9 w-9 border-2 border-white shadow-sm group-hover:shadow-md transition-all flex-shrink-0">
                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-sm">
                  {user?.fullName?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              {/* Name: hidden on mobile */}
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-700 leading-tight group-hover:text-indigo-700 transition-colors">
                  {user?.fullName ?? "User"}
                </p>
                <p className="text-xs text-slate-400">{user?.role}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            {/* Show name in dropdown on mobile */}
            <div className="md:hidden px-2 py-2 border-b border-slate-100 mb-1">
              <p className="text-sm font-semibold text-slate-800">{user?.fullName}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
            </div>
            <DropdownMenuLabel className="text-xs text-slate-400 font-normal">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2.5 text-slate-700">
              <User className="h-4 w-4 text-slate-400" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2.5 text-slate-700">
              <Settings className="h-4 w-4 text-slate-400" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-[#B91C1C] focus:text-[#B91C1C] focus:bg-[#FEF2F2] cursor-pointer gap-2.5 mt-1"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
