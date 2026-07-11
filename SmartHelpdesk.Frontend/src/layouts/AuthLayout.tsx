import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div
      className="min-h-[100dvh] w-full flex items-center justify-center p-4"
      style={{ background: "var(--surface-bg)" }}
    >
      {/* Dot-grid background */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #d4d4d8 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.5,
        }}
      />
      {/* Radial fade overlay to soften edges */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 40%, var(--surface-bg) 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-[380px] animate-fade-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--text-primary)", boxShadow: "var(--shadow-md)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2z"/>
              <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>
            </svg>
          </div>
          <span className="font-semibold text-[15px] tracking-tight" style={{ color: "var(--text-primary)" }}>
            SmartDesk
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-xl border p-7"
          style={{
            background: "var(--surface-default)",
            borderColor: "var(--border-default)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <Outlet />
        </div>

        <p className="text-center mt-6" style={{ color: "var(--text-disabled)", fontSize: "11px" }}>
          &copy; {new Date().getFullYear()} SmartDesk. All rights reserved.
        </p>
      </div>
    </div>
  );
}
