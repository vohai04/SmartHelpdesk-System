import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Ticket, Users } from "lucide-react";
import { useUiStore } from "../../store/uiStore";

export function Sidebar() {
  const location = useLocation();
  const { isSidebarOpen } = useUiStore();

  const navItems = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
    { name: "Tickets", path: "/tickets", icon: <Ticket size={20} /> },
    { name: "Users", path: "/users", icon: <Users size={20} /> },
  ];

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-72 bg-white border-r border-slate-200/60 flex flex-col shadow-sm z-20">
      <div className="h-20 flex items-center px-8 border-b border-slate-100">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200 mr-3">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-800">SmartDesk</span>
      </div>
      
      <div className="px-6 py-8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Main Menu</p>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <span className={`mr-3 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
