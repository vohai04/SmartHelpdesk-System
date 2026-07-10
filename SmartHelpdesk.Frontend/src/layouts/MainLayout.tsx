import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";

export function MainLayout() {
  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-[1280px] mx-auto p-5 sm:p-7 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
