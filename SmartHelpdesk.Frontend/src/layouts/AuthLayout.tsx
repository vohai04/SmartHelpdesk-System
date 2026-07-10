import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAFAFA] p-4 relative overflow-hidden font-sans">
      <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900">
              <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2z"/>
              <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>
            </svg>
          </div>
          <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight mb-2">Smart Helpdesk</h1>
          <p className="text-slate-500 text-[14px]">Streamline your support experience.</p>
        </div>

        {/* Form card */}
        <div className="w-full bg-white border border-slate-200 rounded-[16px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-[13px]">
            &copy; {new Date().getFullYear()} Smart Helpdesk
          </p>
        </div>
      </div>
    </div>
  );
}
