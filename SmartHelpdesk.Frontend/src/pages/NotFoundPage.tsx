import { Link } from "react-router-dom";
export function NotFoundPage() {
  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center p-4"
      style={{ background: "var(--surface-bg)" }}
    >
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, var(--border-strong) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.5,
        }}
      />
      <div className="relative z-10 text-center max-w-sm animate-fade-up">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "var(--text-primary)", boxShadow: "var(--shadow-lg)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <p
          className="text-[11px] font-semibold uppercase tracking-widest mb-2"
          style={{ color: "var(--text-disabled)" }}
        >
          Error 404
        </p>
        <h1 className="text-[32px] font-bold tracking-tight leading-none mb-3" style={{ color: "var(--text-primary)" }}>
          Page not found
        </h1>
        <p className="text-[13px] leading-relaxed max-w-xs mx-auto" style={{ color: "var(--text-tertiary)" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-6 h-9 px-5 rounded-md text-[13px] font-medium text-[var(--text-on-accent)] transition-all duration-150"
          style={{ background: "var(--text-primary)", boxShadow: "var(--shadow-sm)" }}
          onMouseOver={e => { e.currentTarget.style.background = "var(--text-secondary)"; }}
          onMouseOut={e => { e.currentTarget.style.background = "var(--text-primary)"; }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
