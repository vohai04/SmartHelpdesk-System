import { CircleNotch, WarningCircle } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
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

        {/* Panel */}
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[360px] p-6 rounded-xl outline-none animate-fade-up"
          style={{
            background: "var(--surface-default)",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-lg)",
            zIndex: "var(--z-modal,300)",
          }}
        >
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{
              background: isDanger ? "var(--danger-subtle)" : "var(--accent-subtle)",
              border: `1px solid ${isDanger ? "var(--danger-border)" : "var(--accent-border)"}`,
            }}
          >
            <WarningCircle
              size={20}
              weight="fill"
              style={{ color: isDanger ? "var(--danger)" : "var(--accent)" }}
            />
          </div>

          {/* Text */}
          <Dialog.Title className="text-[15px] font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-[13px] leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
            {description}
          </Dialog.Description>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="h-8 px-4 rounded-md text-[12px] font-medium border transition-all duration-150 disabled:opacity-50"
              style={{
                background: "var(--surface-default)",
                borderColor: "var(--border-default)",
                color: "var(--text-secondary)",
              }}
              onMouseOver={e => { e.currentTarget.style.background = "var(--surface-bg)"; }}
              onMouseOut={e => { e.currentTarget.style.background = "var(--surface-default)"; }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="h-8 px-4 rounded-md text-[12px] font-medium text-white flex items-center gap-1.5 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: isDanger ? "var(--danger)" : "var(--accent)",
                boxShadow: "var(--shadow-xs)",
              }}
              onMouseDown={e => { e.currentTarget.style.transform = "scale(0.98)"; }}
              onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {loading && <CircleNotch size={12} className="animate-spin" />}
              {loading ? "Please wait..." : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
