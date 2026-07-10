import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center p-4">
      {/* Subtle grid pattern background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #E5E7EB 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Gradient blobs - very subtle */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo mark */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg shadow-gray-900/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2z"/>
                <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>
              </svg>
            </div>
            <span className="text-[16px] font-semibold text-gray-900 tracking-tight">SmartDesk</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-100/80 overflow-hidden">
          <div className="p-7 sm:p-8">
            <Outlet />
          </div>
        </div>

        <p className="text-center text-[12px] text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} SmartDesk. All rights reserved.
        </p>
      </div>
    </div>
  );
}
