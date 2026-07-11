import { useAuthStore } from "../../store/authStore";
import { ShieldCheck, EnvelopeSimple, User, IdentificationCard, PencilSimple, CalendarBlank } from "@phosphor-icons/react";

const ROLE_CFG: Record<string, { label: string; bg: string; color: string; ring: string }> = {
  Admin:        { label: "Administrator", bg: "#eff6ff", color: "#1d4ed8", ring: "#bfdbfe" },
  SupportAgent: { label: "Support Agent", bg: "#f0f9ff", color: "#0369a1", ring: "#bae6fd" },
  Customer:     { label: "Customer",      bg: "#fafaf9", color: "#78716c", ring: "#e7e5e4" },
};

const AVATAR_COLORS = ["#18181b", "#1d4ed8", "#0369a1", "#15803d", "#9333ea", "#b45309"];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center py-32">
        <p style={{ color: "#a8a29e", fontSize: "13px" }}>Not authenticated.</p>
      </div>
    );
  }

  const roleCfg   = ROLE_CFG[user.role] ?? ROLE_CFG.Customer;
  const initials  = user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const avatarBg  = getAvatarColor(user.fullName);
  const joinedAt  = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "#18181b" }}>
          My Profile
        </h1>
        <p className="mt-0.5 text-[13px]" style={{ color: "#78716c" }}>
          Manage your account information and preferences.
        </p>
      </div>

      {/* 2-column layout on desktop */}
      <div className="grid gap-5" style={{ gridTemplateColumns: "300px 1fr" }}>

        {/* ── LEFT: Identity card ── */}
        <div className="space-y-4">
          {/* Avatar card */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "#fff", border: "1px solid #e7e5e4" }}
          >
            {/* Colored banner */}
            <div
              className="h-24 relative"
              style={{ background: `linear-gradient(135deg, ${avatarBg}22 0%, ${avatarBg}11 100%)` }}
            />

            {/* Avatar + name */}
            <div className="px-5 pb-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-[20px] font-bold -mt-8 mb-3 ring-4"
                style={{
                  background: avatarBg,
                  color: "#fff",
                  boxShadow: "0 0 0 4px #fff, 0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                {initials}
              </div>

              <h2 className="text-[16px] font-semibold" style={{ color: "#18181b" }}>
                {user.fullName}
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: "#a8a29e" }}>
                {user.email}
              </p>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span
                  className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: roleCfg.bg, color: roleCfg.color, border: `1px solid ${roleCfg.ring}` }}
                >
                  {roleCfg.label}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full"
                  style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#16a34a", display: "inline-block" }} />
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Edit button */}
          <button
            disabled
            title="Profile editing coming soon"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "#fff",
              border: "1px solid #e7e5e4",
              color: "#57534e",
            }}
          >
            <PencilSimple size={14} weight="regular" />
            Edit profile
          </button>

          {/* Security note */}
          <div
            className="rounded-xl p-4"
            style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
          >
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={16} weight="fill" style={{ color: "#2563eb", flexShrink: 0, marginTop: "1px" }} />
              <div>
                <p className="text-[12px] font-semibold" style={{ color: "#1d4ed8" }}>Secure account</p>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#3b82f6" }}>
                  Password changes are managed by your administrator.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Account details ── */}
        <div className="space-y-4">
          {/* Account info card */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "#fff", border: "1px solid #e7e5e4" }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid #f5f5f4" }}
            >
              <div>
                <h3 className="text-[14px] font-semibold" style={{ color: "#18181b" }}>
                  Account Information
                </h3>
                <p className="text-[12px] mt-0.5" style={{ color: "#a8a29e" }}>
                  Your personal details stored in the system.
                </p>
              </div>
            </div>

            <div>
              {[
                {
                  icon: <User size={15} weight="regular" />,
                  label: "Full Name",
                  value: user.fullName,
                },
                {
                  icon: <EnvelopeSimple size={15} weight="regular" />,
                  label: "Email Address",
                  value: user.email,
                },
                {
                  icon: <ShieldCheck size={15} weight="regular" />,
                  label: "Role",
                  value: roleCfg.label,
                },
                {
                  icon: <CalendarBlank size={15} weight="regular" />,
                  label: "Member since",
                  value: joinedAt,
                },
                {
                  icon: <IdentificationCard size={15} weight="regular" />,
                  label: "Account ID",
                  value: user.id || "-",
                  mono: true,
                },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className="flex items-center gap-4 px-6 py-4"
                  style={{
                    borderBottom: i < arr.length - 1 ? "1px solid #f5f5f4" : "none",
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "#fafaf9", border: "1px solid #e7e5e4", color: "#a8a29e" }}
                  >
                    {row.icon}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                    <p className="text-[12px] font-medium" style={{ color: "#a8a29e", flexShrink: 0 }}>
                      {row.label}
                    </p>
                    <p
                      className="text-[13px] font-medium truncate text-right"
                      style={{
                        color: "#18181b",
                        fontFamily: row.mono ? "'Geist Mono', monospace" : "inherit",
                        fontSize: row.mono ? "11px" : "13px",
                      }}
                    >
                      {row.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity placeholder */}
          <div
            className="rounded-xl p-6"
            style={{ background: "#fff", border: "1px solid #e7e5e4" }}
          >
            <h3 className="text-[14px] font-semibold mb-1" style={{ color: "#18181b" }}>
              Account Activity
            </h3>
            <p className="text-[12px]" style={{ color: "#a8a29e" }}>
              Activity tracking and session management will be available in a future update.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: "Tickets created",  value: "-" },
                { label: "Messages sent",    value: "-" },
              ].map(s => (
                <div
                  key={s.label}
                  className="rounded-lg p-3"
                  style={{ background: "#fafaf9", border: "1px solid #f5f5f4" }}
                >
                  <p className="text-[20px] font-bold" style={{ color: "#18181b" }}>{s.value}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#a8a29e" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
