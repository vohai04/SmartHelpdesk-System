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
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-10 sticky top-0 z-10">
      {/* Search & Toggle */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center bg-slate-100/80 px-4 py-2.5 rounded-full w-96 border border-slate-200/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
          <Search size={18} className="text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search tickets, users, or articles..." 
            className="bg-transparent border-none outline-none w-full text-sm text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-6">
        <button className="text-slate-400 hover:text-indigo-600 transition-colors relative">
          <Bell size={22} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="text-slate-400 hover:text-indigo-600 transition-colors">
          <Settings size={22} />
        </button>
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center cursor-pointer group outline-none">
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm group-hover:shadow-md transition-all">
                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">
                  {user?.fullName || 'Administrator'}
                </p>
                <p className="text-xs text-slate-500 font-medium">{user?.role || 'Support Agent'}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4 text-slate-500" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4 text-slate-500" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
