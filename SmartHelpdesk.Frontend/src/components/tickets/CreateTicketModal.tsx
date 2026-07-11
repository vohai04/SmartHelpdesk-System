import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { X, CircleNotch, Sparkle } from "@phosphor-icons/react";
import { useToast } from "../../hooks/use-toast";
import { ticketService } from "../../services/ticketService";
import { categoryService, type CategoryDto } from "../../services/categoryService";

const createTicketSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description is too long"),
  categoryId: z.string().min(1, "Please select a category"),
});

type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

interface CreateTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateTicketModal({ open, onOpenChange, onSuccess }: CreateTicketModalProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      categoryId: "",
    },
  });

  useEffect(() => {
    if (open) {
      setLoadingCats(true);
      categoryService.getCategories()
        .then(setCategories)
        .catch(() => toast({ title: "Error", description: "Failed to load categories", variant: "destructive" }))
        .finally(() => setLoadingCats(false));
    } else {
      reset();
    }
  }, [open, reset, toast]);

  const onSubmit = async (data: CreateTicketFormValues) => {
    try {
      await ticketService.createTicket(data);
      toast({ title: "Ticket created", description: "Your ticket has been submitted successfully. Priority was auto-assigned by AI." });
      onSuccess();
      onOpenChange(false);
    } catch {
      toast({ title: "Error", description: "Failed to create ticket.", variant: "destructive" });
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={o => !isSubmitting && onOpenChange(o)}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)", zIndex: "var(--z-modal,300)" }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] outline-none"
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
                  Create New Ticket
                </Dialog.Title>
                <Dialog.Description className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  Please provide details about your issue.
                </Dialog.Description>
              </div>
              <Dialog.Close
                disabled={isSubmitting}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                style={{ color: "var(--text-disabled)" }}
                onMouseOver={e => { e.currentTarget.style.background = "var(--surface-bg)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-disabled)"; }}
              >
                <X size={16} weight="bold" />
              </Dialog.Close>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              
              {/* Title */}
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Title <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="E.g., Cannot connect to VPN"
                  {...register("title")}
                  className="w-full h-9 px-3 rounded-lg text-[13px] outline-none transition-all duration-150"
                  style={{
                    background: "var(--surface-default)",
                    border: `1px solid ${errors.title ? "var(--danger)" : "var(--border-strong)"}`,
                    color: "var(--text-primary)",
                  }}
                  onFocusCapture={e => {
                    if (!errors.title) {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-subtle)";
                    }
                  }}
                  onBlurCapture={e => {
                    if (!errors.title) {
                      e.currentTarget.style.borderColor = "var(--border-strong)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                />
                {errors.title && <p className="text-[11px] mt-1.5" style={{ color: "var(--danger)" }}>{errors.title.message}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Category <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <select
                  {...register("categoryId")}
                  disabled={loadingCats}
                  className="w-full h-9 px-3 rounded-lg text-[13px] outline-none transition-all duration-150 appearance-none bg-no-repeat"
                  style={{
                    backgroundColor: "var(--surface-default)",
                    border: `1px solid ${errors.categoryId ? "var(--danger)" : "var(--border-strong)"}`,
                    color: "var(--text-primary)",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 256 256'%3E%3Cpath fill='%23a8a29e' d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'/%3E%3C/svg%3E")`,
                    backgroundPosition: "right 12px center",
                  }}
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-[11px] mt-1.5" style={{ color: "var(--danger)" }}>{errors.categoryId.message}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Description <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <textarea
                  placeholder="Provide as much detail as possible..."
                  {...register("description")}
                  rows={5}
                  className="w-full p-3 rounded-lg text-[13px] outline-none transition-all duration-150 resize-y"
                  style={{
                    background: "var(--surface-default)",
                    border: `1px solid ${errors.description ? "var(--danger)" : "var(--border-strong)"}`,
                    color: "var(--text-primary)",
                  }}
                  onFocusCapture={e => {
                    if (!errors.description) {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-subtle)";
                    }
                  }}
                  onBlurCapture={e => {
                    if (!errors.description) {
                      e.currentTarget.style.borderColor = "var(--border-strong)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                />
                {errors.description && <p className="text-[11px] mt-1.5" style={{ color: "var(--danger)" }}>{errors.description.message}</p>}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-medium p-2.5 rounded-lg" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
                <Sparkle size={14} weight="fill" />
                <span>Ticket priority will be automatically determined by our AI based on your title and description.</span>
              </div>

              {/* Footer buttons */}
              <div className="pt-4 flex items-center justify-end gap-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="h-9 px-4 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50"
                  style={{ color: "var(--text-secondary)", background: "var(--surface-bg)" }}
                  onMouseOver={e => { e.currentTarget.style.background = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "var(--surface-bg)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-5 rounded-lg text-[12px] font-semibold text-white flex items-center gap-2 transition-all duration-150 disabled:opacity-60"
                  style={{ background: "var(--accent)", boxShadow: "var(--shadow-sm)" }}
                  onMouseDown={e => { e.currentTarget.style.transform = "scale(0.97)"; }}
                  onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {isSubmitting && <CircleNotch size={14} className="animate-spin" />}
                  {isSubmitting ? "Creating & Analyzing..." : "Create Ticket"}
                </button>
              </div>

            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
