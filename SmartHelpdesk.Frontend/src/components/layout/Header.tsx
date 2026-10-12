import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { List, MagnifyingGlass, GearSix, SignOut, CaretDown } from "@phosphor-icons/react";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/authService";
import { useUiStore } from "../../store/uiStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { GlobalSearchModal } from "./GlobalSearchModal";

export function Header() {
  const user = useAuthStore(s=>s.user);
  const logout = useAuthStore(s=>s.logout);
  const toggleSidebar = useUiStore(s=>s.toggleSidebar);
  const open = useUiStore(s=>s.isSidebarOpen);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen,setSearchOpen] = useState(false);
  useEffect(()=>{
    const key = (event: KeyboardEvent)=>{if((event.ctrlKey||event.metaKey)&&event.key==="k"){event.preventDefault();setSearchOpen(true);}};
    window.addEventListener("keydown",key);
    return ()=>window.removeEventListener("keydown",key);
  },[]);
  const page = location.pathname.startsWith("/tickets/") ? "Conversation" : ({"/":"Overview","/tickets":"Tickets","/settings":"Settings","/users":"People","/admin/categories":"Categories","/admin/audit-logs":"Activity log"}[location.pathname] ?? "Workspace");
  const initials = (user?.fullName??"U").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  const signOut = async()=>{await authService.logout();logout();navigate("/auth/login");};
  return (
    <header className="app-header">
      <div className="header-location"><button className="icon-button" onClick={toggleSidebar} aria-label="Toggle navigation" aria-expanded={open} aria-controls="workspace-navigation"><List size={23}/></button><div className="header-breadcrumb"><span>Workspace</span><span className="breadcrumb-divider">/</span><strong>{page}</strong></div></div>
      <div className="header-actions">
        <button className="header-search" onClick={()=>setSearchOpen(true)} aria-label="Search tickets"><MagnifyingGlass size={19}/><span>Search tickets</span><kbd>Ctrl K</kbd></button>
        <ThemeToggle/><NotificationBell/>
        <DropdownMenu><DropdownMenuTrigger asChild><button className="header-account" aria-label="Account menu"><span className="person-avatar">{initials}</span><CaretDown size={13}/></button></DropdownMenuTrigger>
          <DropdownMenuContent className="account-dropdown" align="end" sideOffset={10}>
            <div className="dropdown-person"><strong>{user?.fullName}</strong><small>{user?.email}</small></div><DropdownMenuSeparator/>
            <DropdownMenuItem asChild><Link to="/settings"><GearSix size={18}/>Settings</Link></DropdownMenuItem><DropdownMenuSeparator/>
            <DropdownMenuItem onClick={signOut} className="sign-out"><SignOut size={18}/>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <GlobalSearchModal open={searchOpen} onOpenChange={setSearchOpen}/>
    </header>
  );
}
