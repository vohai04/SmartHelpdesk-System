import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Tag, Robot } from "@phosphor-icons/react";
import type { CategoryDto } from "../../services/categoryService";

interface CategoryModalProps {
  isOpen: boolean;
  initialData: CategoryDto | null;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; aiRoutingKeywords: string }) => Promise<void>;
}

export function CategoryModal({ isOpen, initialData, onClose, onSubmit }: CategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [aiRoutingKeywords, setAiRoutingKeywords] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name ?? "");
      setDescription(initialData?.description ?? "");
      setAiRoutingKeywords(initialData?.aiRoutingKeywords ?? "");
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ name, description, aiRoutingKeywords });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)", zIndex: "var(--z-modal,300)" }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[500px] outline-none"
          style={{ zIndex: "var(--z-modal,300)" }}
        >
          <div
            className="w-full rounded-2xl overflow-hidden flex flex-col max-h-[90dvh] animate-fade-up"
            style={{ background: "var(--surface-default)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-xl)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <Dialog.Title className="text-[15px] font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Tag size={18} style={{ color: "var(--accent)" }} />
                  {initialData ? "Edit Category" : "New Category"}
                </Dialog.Title>
                <Dialog.Description className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  Configure details and AI keywords.
                </Dialog.Description>
              </div>
              <Dialog.Close
                disabled={loading}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                style={{ color: "var(--text-disabled)" }}
                onMouseOver={e => { e.currentTarget.style.background = "var(--surface-bg)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-disabled)"; }}
              >
                <X size={16} weight="bold" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Category Name
                  </label>
                  <input
                    autoFocus
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Hardware Issue"
                    className="w-full h-10 px-3 rounded-lg text-[13px] transition-colors focus:outline-none"
                    style={{
                      background: "var(--surface-bg)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)"
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onBlur={e => e.currentTarget.style.borderColor = "var(--border-default)"}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this category"
                    rows={3}
                    className="w-full p-3 rounded-lg text-[13px] transition-colors focus:outline-none resize-none"
                    style={{
                      background: "var(--surface-bg)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)"
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onBlur={e => e.currentTarget.style.borderColor = "var(--border-default)"}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                    <Robot size={15} style={{ color: "var(--accent)" }} />
                    AI Routing Keywords
                  </label>
                  <p className="text-[11px] mb-2" style={{ color: "var(--text-tertiary)" }}>
                    Comma-separated keywords. AI will use these to auto-route tickets to this category.
                  </p>
                  <textarea
                    value={aiRoutingKeywords}
                    onChange={(e) => setAiRoutingKeywords(e.target.value)}
                    placeholder="e.g. screen, monitor, broken glass, pixel"
                    rows={2}
                    className="w-full p-3 rounded-lg text-[13px] transition-colors focus:outline-none resize-none"
                    style={{
                      background: "var(--surface-bg)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)"
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onBlur={e => e.currentTarget.style.borderColor = "var(--border-default)"}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 flex justify-end gap-3" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface-bg)" }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50"
                  style={{ color: "var(--text-secondary)", background: "var(--surface-default)", border: "1px solid var(--border-default)" }}
                  onMouseOver={e => e.currentTarget.style.background = "var(--border-subtle)"}
                  onMouseOut={e => e.currentTarget.style.background = "var(--surface-default)"}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                  style={{ background: "var(--accent)", color: "white", boxShadow: "var(--shadow-sm)" }}
                  onMouseOver={e => e.currentTarget.style.filter = "brightness(1.1)"}
                  onMouseOut={e => e.currentTarget.style.filter = "none"}
                >
                  {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {initialData ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
