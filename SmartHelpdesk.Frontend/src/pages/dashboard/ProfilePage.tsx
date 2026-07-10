import { useAuthStore } from "../../store/authStore";
import { Shield, Mail, User, Pencil, Calendar } from "lucide-react";

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-400 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-[14px] font-medium text-gray-900 mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}

const ROLE_STYLE: Record<string, { label: string; cls: string }> = {
  Admin:        { label: "Administrator",  cls: "bg-purple-50 text-purple-700 border-purple-200" },
  SupportAgent: { label: "Support Agent",  cls: "bg-blue-50   text-blue-700   border-blue-200" },
  Customer:     { label: "Customer",       cls: "bg-gray-50   text-gray-600   border-gray-200" },
};

export function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-[14px]">Not authenticated.</p>
      </div>
    );
  }

  const roleCfg = ROLE_STYLE[user.role] ?? { label: user.role, cls: "bg-gray-50 text-gray-600 border-gray-200" };
  const initials = user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Page header */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Profile</h1>
        <p className="text-[13px] text-gray-500 mt-1">Your account details and preferences.</p>
      </div>

      {/* Profile card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-gray-100 to-gray-50" />

        {/* Avatar + info */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-5">
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg bg-gray-900 flex items-center justify-center text-white text-[22px] font-bold">
              {initials}
            </div>
            <button
              disabled
              title="Edit profile (coming soon)"
              className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Pencil size={12} />
              Edit profile
            </button>
          </div>

          <div>
            <h2 className="text-[18px] font-bold text-gray-900">{user.fullName}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${roleCfg.cls}`}>
                {roleCfg.label}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account info */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-[14px] font-semibold text-gray-900">Account Information</h3>
          <p className="text-[12px] text-gray-500 mt-0.5">Your account details stored in the system.</p>
        </div>
        <div className="px-6">
          <InfoRow icon={<User size={14} />} label="Full Name" value={user.fullName} />
          <InfoRow icon={<Mail size={14} />} label="Email Address" value={user.email} />
          <InfoRow icon={<Shield size={14} />} label="Role" value={roleCfg.label} />
          <InfoRow icon={<Calendar size={14} />} label="Account ID" value={user.id || "—"} />
        </div>
      </div>

      {/* Note */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <Shield size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[13px] font-medium text-blue-800">Secure account</p>
          <p className="text-[12px] text-blue-600 mt-0.5">Your data is protected. Password changes and advanced settings are managed by an administrator.</p>
        </div>
      </div>
    </div>
  );
}
