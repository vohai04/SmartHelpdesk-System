import { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { SquaresFour, Ticket, GearSix } from "@phosphor-icons/react";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { useUiStore } from "../store/uiStore";

const mobileItems = [
  { to: "/", label: "Overview", icon: SquaresFour },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/settings", label: "Settings", icon: GearSix },
];

export function MainLayout() {
  const open = useUiStore(s => s.isSidebarOpen);
  const setOpen = useUiStore(s => s.setSidebarOpen);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setOpen(media.matches);
    media.addEventListener("change", update);
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape" && !media.matches) setOpen(false); };
    window.addEventListener("keydown", escape);
    return () => { media.removeEventListener("change", update); window.removeEventListener("keydown", escape); };
  }, [setOpen]);
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      {open && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <Sidebar />
      <div className="app-workspace">
        <Header />
        <main id="main-content" tabIndex={-1} className="app-main"><Outlet /></main>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {mobileItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} onClick={() => setOpen(false)} className={({isActive}) => isActive ? "active" : ""}>
              <Icon size={21} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
