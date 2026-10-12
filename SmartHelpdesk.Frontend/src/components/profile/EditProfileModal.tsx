import { isAxiosError } from "axios";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, CircleNotch, User } from "@phosphor-icons/react";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";

interface EditProfileModalProps {
  open: boolean;
  onReturnFocus?: () => void;
  onOpenChange: (open: boolean) => void;
  onSuccess: (fullName: string) => void;
}

export function EditProfileModal({ open, onOpenChange, onSuccess, onReturnFocus }: EditProfileModalProps) {
  const { user, login: storeLogin } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName === user?.fullName) return;

    setLoading(true);
    setError("");

    try {
      const result = await authService.updateProfile({ fullName });
      const newToken = result.token || result.Token;
      if (newToken) {
        localStorage.setItem("token", newToken);
        storeLogin(newToken, {
          id: result.userId || result.UserId || "",
          email: result.email || result.Email || "",
          fullName: result.fullName || result.FullName || "",
          role: result.role || result.Role || "",
        });
      }
      onSuccess(fullName);
      onOpenChange(false);
    } catch (err: unknown) {
      setError((isAxiosError<{ message?: string }>(err) && err.response?.data?.message) || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={o => !loading && onOpenChange(o)}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)", zIndex: "var(--z-modal,300)" }}
        />
        <Dialog.Content
          onCloseAutoFocus={event => { if (onReturnFocus) { event.preventDefault(); onReturnFocus(); } }}
          className="workspace-dialog fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[420px] outline-none"
          style={{ zIndex: "var(--z-modal,300)" }}
        >
          <div
            className="w-full rounded-2xl overflow-hidden flex flex-col animate-fade-up"
            style={{ background: "var(--surface-default)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-xl)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <Dialog.Title className="text-[15px] font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <User size={16} /> Edit Profile
                </Dialog.Title>
                <Dialog.Description className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  Update your personal information.
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label="Close dialog"
                disabled={loading}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                style={{ color: "var(--text-disabled)" }}
                onMouseOver={e => { e.currentTarget.style.background = "var(--surface-bg)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-disabled)"; }}
              >
                <X size={16} weight="bold" />
              </Dialog.Close>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Email Address</label>
                <input
                  type="text"
                  value={user?.email || ""}
                  disabled
                  className="w-full h-9 px-3 rounded-lg border text-[13px] outline-none"
                  style={{ background: "var(--surface-bg)", borderColor: "var(--border-strong)", color: "var(--text-tertiary)" }}
                />
                <p className="mt-1.5 text-[11px]" style={{ color: "var(--text-disabled)" }}>Email address cannot be changed.</p>
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoFocus
                  className="w-full h-9 px-3 rounded-lg border text-[13px] outline-none transition-all duration-150"
                  style={{ background: "var(--surface-default)", borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-subtle)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              {error && (
                <div className="text-[12px] font-medium mt-2" style={{ color: "var(--danger)" }}>
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2" style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "24px", paddingTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="h-9 px-4 rounded-lg text-[12px] font-medium transition-colors"
                  style={{ color: "var(--text-secondary)", background: "var(--surface-bg)" }}
                  onMouseOver={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--surface-hover)"; }}
                  onMouseOut={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "var(--surface-bg)"; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !fullName.trim() || fullName === user?.fullName}
                  className="h-9 px-4 rounded-lg text-[12px] font-semibold text-[var(--text-on-accent)] flex items-center gap-2 transition-transform duration-150 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
                  style={{ background: "var(--accent)", boxShadow: "var(--shadow-sm)" }}
                >
                  {loading && <CircleNotch size={14} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
