import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { useUiStore } from "../store/uiStore";

export function MainLayout() {
  const { isSidebarOpen, setSidebarOpen } = useUiStore();

  return (
    <div
      className="flex overflow-hidden"
      style={{
        height: "100dvh",
        background: "#f5f5f4",
      }}
    >
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.3)" }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar - always in DOM on desktop, toggle on mobile */}
      <Sidebar />

      {/* Right panel */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: "#f5f5f4" }}
        >
          <div
            className="mx-auto animate-fade-up"
            style={{
              maxWidth: "1200px",
              padding: "28px 32px",
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
