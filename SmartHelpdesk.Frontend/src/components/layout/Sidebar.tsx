import { useEffect, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import { SquaresFour, Ticket, Users, Tag, FileText, X, GearSix, ChatsCircle, CaretRight } from "@phosphor-icons/react";
import { useUiStore } from "../../store/uiStore";
import { useAuthStore } from "../../store/authStore";

export function Sidebar() {
  const open = useUiStore(s => s.isSidebarOpen);
  const setOpen = useUiStore(s => s.setSidebarOpen);
  const user = useAuthStore(s => s.user);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open || window.matchMedia("(min-width: 1024px)").matches) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = ref.current;
    const focusables = () => panel?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])');
    focusables()?.[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = focusables();
      if (!elements?.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    panel?.addEventListener("keydown", trap);
    return () => { panel?.removeEventListener("keydown", trap); previous?.focus(); };
  }, [open]);
  const closeOnMobile = () => { if (window.innerWidth < 1024) setOpen(false); };
  const primary = [{to:"/", label:"Overview", icon:SquaresFour}, {to:"/tickets", label:"Tickets", icon:Ticket}];
  const admin = [{to:"/users",label:"People",icon:Users},{to:"/admin/categories",label:"Categories",icon:Tag},{to:"/admin/audit-logs",label:"Activity log",icon:FileText}];
  const account = [{to:"/settings",label:"Settings",icon:GearSix}];
  const initials = (user?.fullName ?? "U").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  const renderLinks = (items: typeof primary) => items.map(({to,label,icon:Icon}) => (
    <NavLink key={to} to={to} end={to==="/"} onClick={closeOnMobile} className={({isActive})=>`nav-item ${isActive?"active":""}`}>
      <Icon size={20} /><span>{label}</span><CaretRight size={12} className="nav-chevron" />
    </NavLink>
  ));
  return (
    <aside ref={ref} id="workspace-navigation" className={`app-sidebar ${open?"is-open":""}`} aria-label="Workspace navigation">
      <div className="sidebar-brand"><Link to="/" onClick={closeOnMobile} className="brand"><span className="brand-symbol"><ChatsCircle size={23} weight="fill" /></span><span>SmartDesk<small>Support workspace</small></span></Link><button className="sidebar-close icon-button" onClick={()=>setOpen(false)} aria-label="Close sidebar"><X size={21} /></button></div>
      <nav className="sidebar-navigation" aria-label="Main navigation">
        <div className="nav-group">{renderLinks(primary)}</div>
        {user?.role==="Admin" && <div className="nav-group"><p className="nav-group-title">Administration</p>{renderLinks(admin)}</div>}
        <div className="nav-group account-navigation"><p className="nav-group-title">Account</p>{renderLinks(account)}</div>
      </nav>
      <div className="sidebar-footer"><Link to="/settings" onClick={closeOnMobile} className="sidebar-person"><span className="person-avatar">{initials}</span><span className="person-name"><strong>{user?.fullName}</strong><small>{user?.role==="Admin"?"Administrator":user?.role}</small></span><CaretRight size={16} /></Link></div>
    </aside>
  );
}
