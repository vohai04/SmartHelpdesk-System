import { useEffect, useState } from "react";
import {
  Ticket, Clock, CheckCircle, Smile,
  Trash2, AlertCircle, Loader2, TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { ticketService, type TicketDto } from "../../services/ticketService";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { useToast } from "../../hooks/use-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; dotClass: string; textClass: string }> = {
  Open:       { label: "Open",        dotClass: "bg-rose-500", textClass: "text-rose-700" },
  InProgress: { label: "In Progress", dotClass: "bg-amber-500", textClass: "text-amber-700" },
  Resolved:   { label: "Resolved",    dotClass: "bg-emerald-500", textClass: "text-emerald-700" },
  Closed:     { label: "Closed",      dotClass: "bg-slate-400", textClass: "text-slate-600" },
};

const PRIORITY_CONFIG: Record<string, { label: string; textClass: string }> = {
  Urgent: { label: "Urgent", textClass: "text-rose-600 font-medium" },
  High:   { label: "High",   textClass: "text-orange-600 font-medium" },
  Medium: { label: "Medium", textClass: "text-slate-700" },
  Low:    { label: "Low",    textClass: "text-slate-500" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, dotClass: "bg-slate-400", textClass: "text-slate-600" };
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
      <span className={`text-[12px] font-medium ${cfg.textClass}`}>{cfg.label}</span>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] ?? { label: priority, textClass: "text-slate-500" };
  return (
    <span className={`text-[12px] ${cfg.textClass}`}>
      {cfg.label}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  loading?: boolean;
}

function StatCard({ label, value, icon, trend, trendPositive, loading }: StatCardProps) {
  return (
    <div className="bg-white rounded-[12px] border border-slate-200 p-5 flex flex-col justify-between h-[120px]">
      <div className="flex items-center justify-between text-slate-500">
        <p className="text-[13px] font-medium">{label}</p>
        <div className="text-slate-400 opacity-70">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[28px] font-semibold text-slate-900 tracking-tight leading-none">
          {loading ? <span className="animate-pulse text-slate-300">—</span> : value}
        </p>
        {trend && !loading && (
          <div className="flex items-center gap-1 mt-2 text-[11px] font-medium">
            <span className={trendPositive ? 'text-emerald-600 flex items-center gap-0.5' : 'text-slate-500 flex items-center gap-0.5'}>
              {trendPositive ? <ArrowUpRight size={12} /> : null}
              {trend}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">{title}</h1>
      <p className="text-[14px] text-slate-500 mt-1">{subtitle}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const role      = user?.role ?? "Customer";
  const isAdmin   = role === "Admin";
  const isCustomer = role === "Customer";

  const [tickets, setTickets]       = useState<TicketDto[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TicketDto | null>(null);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    ticketService.getTickets({ pageNumber: 1, pageSize: 10 })
      .then((r) => { if (!cancelled) setTickets(r.items ?? []); })
      .catch(() => { if (!cancelled) setError("Failed to load tickets. Check your connection or restart the backend."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Stats
  const total    = tickets.length;
  const open     = tickets.filter(t => t.status === "Open").length;
  const resolved = tickets.filter(t => t.status === "Resolved" || t.status === "Closed").length;

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await ticketService.deleteTicket(deleteTarget.id);
      setTickets(prev => prev.filter(t => t.id !== deleteTarget.id));
      toast({ title: "Ticket deleted", description: `"${deleteTarget.title}" has been removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Delete failed", description: "Could not delete ticket. Please try again.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <PageHeader
        title={isCustomer ? "My Dashboard" : "Overview"}
        subtitle={`Welcome back, ${user?.fullName ?? ""}. ${isCustomer ? "Here are your support tickets." : "Here's what's happening across the helpdesk."}`}
      />

      {/* ── Stats ── */}
      <div className={`grid gap-4 ${isCustomer ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"}`}>
        <StatCard
          label={isCustomer ? "My Tickets" : "Total Tickets"}
          value={total}
          icon={<Ticket size={16} strokeWidth={2} />}
          trend={isCustomer ? undefined : "+12% this month"}
          trendPositive
          loading={loading}
        />
        <StatCard
          label={isCustomer ? "My Open" : "Open Tickets"}
          value={open}
          icon={<Clock size={16} strokeWidth={2} />}
          trend={open > 0 ? "Requires attention" : "No backlog"}
          trendPositive={open === 0}
          loading={loading}
        />
        <StatCard
          label={isCustomer ? "My Resolved" : "Resolved / Closed"}
          value={resolved}
          icon={<CheckCircle size={16} strokeWidth={2} />}
          trend="From current records"
          loading={loading}
        />
        {!isCustomer && (
          <StatCard
            label="Satisfaction"
            value="98%"
            icon={<Smile size={16} strokeWidth={2} />}
            trend="Based on surveys"
            trendPositive
            loading={loading}
          />
        )}
      </div>

      {/* ── Tickets Table ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold text-slate-900 tracking-tight">
            {isCustomer ? "Recent Tickets" : "Latest Activity"}
          </h2>
          <span className="text-[12px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {role}
          </span>
        </div>

        <div className="bg-white rounded-[12px] border border-slate-200 overflow-hidden shadow-sm">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
              <Loader2 size={24} className="animate-spin text-slate-300" />
              <span className="text-[13px]">Loading tickets...</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-red-500">
              <AlertCircle size={24} />
              <span className="text-[13px] text-center max-w-sm">{error}</span>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && tickets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
              <Ticket size={32} className="opacity-20" />
              <span className="text-[13px]">No tickets found.</span>
            </div>
          )}

          {/* Table */}
          {!loading && !error && tickets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-[12px] font-medium text-slate-500 px-5 py-3 w-[40%]">Title</th>
                    <th className="text-[12px] font-medium text-slate-500 px-4 py-3">Status</th>
                    <th className="text-[12px] font-medium text-slate-500 px-4 py-3">Priority</th>
                    <th className="text-[12px] font-medium text-slate-500 px-4 py-3">Created</th>
                    {isAdmin && (
                      <th className="text-[12px] font-medium text-slate-500 px-5 py-3 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3.5 max-w-[200px]">
                        <p className="font-medium text-[14px] text-slate-900 truncate">{ticket.title}</p>
                        <p className="text-[12px] text-slate-500 truncate mt-0.5">{ticket.description}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-[12px]">
                        {formatDate(ticket.createdAt)}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setDeleteTarget(ticket)}
                            title="Delete ticket"
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm Delete Modal ── */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => { if (!deleting) setDeleteTarget(null); }}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Ticket"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Ticket"
      />
    </div>
  );
}
