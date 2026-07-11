import { CircleNotch, WarningCircle, Info } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "primary" | "info";
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "danger",
}: ConfirmModalProps) {
  const isDanger = variant === "danger";

  return (
    <Dialog.Root open={open} onOpenChange={o => { if (!o && !loading) onClose(); }}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay
          className="fixed inset-0"
          style={{
            background: "rgba(0,0,0,0.25)",
            backdropFilter: "blur(2px)",
            zIndex: "var(--z-modal,300)",
          }}
        />

        {/* Panel Wrapper to avoid animation transform conflicts */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: "var(--z-modal,300)" }}>
          <Dialog.Content
            className="w-11/12 max-w-sm max-h-[85vh] overflow-y-auto p-6 rounded-[20px] outline-none animate-fade-up text-center flex flex-col items-center pointer-events-auto"
            style={{
              background: "var(--surface-default)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-xl)",
            }}
          >
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{
              background: isDanger ? "var(--danger-subtle)" : "var(--accent-subtle)",
              border: `4px solid ${isDanger ? "var(--danger-border)" : "var(--accent-border)"}`,
            }}
          >
            {isDanger ? (
              <WarningCircle size={24} weight="fill" style={{ color: "var(--danger)" }} />
            ) : (
              <Info size={24} weight="fill" style={{ color: "var(--accent)" }} />
            )}
          </div>

          {/* Text */}
          <Dialog.Title className="text-[17px] font-bold mb-2 tracking-tight" style={{ color: "var(--text-primary)" }}>
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-[13px] leading-relaxed mb-6 px-2" style={{ color: "var(--text-tertiary)" }}>
            {description}
          </Dialog.Description>

          {/* Actions */}
          <div className="flex items-center justify-center w-full gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-10 rounded-xl text-[13px] font-semibold border transition-all duration-150 disabled:opacity-50"
              style={{
                background: "var(--surface-default)",
                borderColor: "var(--border-strong)",
                color: "var(--text-primary)",
              }}
              onMouseOver={e => { e.currentTarget.style.background = "var(--surface-bg)"; }}
              onMouseOut={e => { e.currentTarget.style.background = "var(--surface-default)"; }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: isDanger ? "var(--danger)" : "var(--accent)",
                boxShadow: "var(--shadow-sm)",
              }}
              onMouseDown={e => { e.currentTarget.style.transform = "scale(0.98)"; }}
              onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {loading && <CircleNotch size={14} className="animate-spin" />}
              {loading ? "Wait..." : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
