import { useEffect, useState } from "react";
import {
  Ticket, Clock, CheckCircle, Smile,
  Trash2, AlertCircle, Loader2, TrendingUp,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { ticketService, type TicketDto } from "../../services/ticketService";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { useToast } from "../../hooks/use-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  Open:       { label: "Open",        className: "bg-red-50 text-red-700 ring-red-200" },
  InProgress: { label: "In Progress", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  Resolved:   { label: "Resolved",    className: "bg-green-50 text-green-700 ring-green-200" },
  Closed:     { label: "Closed",      className: "bg-slate-100 text-slate-600 ring-slate-200" },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  Urgent: { label: "Urgent", className: "bg-rose-50 text-rose-700 ring-rose-200" },
  High:   { label: "High",   className: "bg-orange-50 text-orange-700 ring-orange-200" },
  Medium: { label: "Medium", className: "bg-blue-50 text-blue-700 ring-blue-200" },
  Low:    { label: "Low",    className: "bg-slate-50 text-slate-500 ring-slate-200" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-slate-100 text-slate-600 ring-slate-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] ?? { label: priority, className: "bg-slate-100 text-slate-600 ring-slate-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${cfg.className}`}>
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
  iconBg: string;
  trend?: string;
  trendPositive?: boolean;
  loading?: boolean;
}

function StatCard({ label, value, icon, iconBg, trend, trendPositive, loading }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1.5">
            {loading ? <span className="animate-pulse text-slate-300">—</span> : value}
          </p>
          {trend && !loading && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trendPositive ? 'text-emerald-600' : 'text-slate-400'}`}>
              <TrendingUp size={11} />
              {trend}
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-[22px] font-bold text-slate-900 leading-tight">{title}</h1>
      <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
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
    <div className="space-y-6">
      <PageHeader
        title={isCustomer ? "My Dashboard" : "System Dashboard"}
        subtitle={`Welcome back, ${user?.fullName ?? ""}. ${isCustomer ? "Here are your support tickets." : "Here's an overview of all helpdesk activity."}`}
      />

      {/* ── Stats ── */}
      <div className={`grid gap-4 ${isCustomer ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"}`}>
        <StatCard
          label={isCustomer ? "My Tickets" : "Total Tickets"}
          value={total}
          icon={<Ticket size={20} className="text-indigo-600" />}
          iconBg="bg-indigo-50"
          trend={isCustomer ? undefined : "+12% this month"}
          trendPositive
          loading={loading}
        />
        <StatCard
          label={isCustomer ? "My Open" : "Open Tickets"}
          value={open}
          icon={<Clock size={20} className="text-red-500" />}
          iconBg="bg-red-50"
          trend={open > 0 ? "Needs attention" : "All clear"}
          trendPositive={open === 0}
          loading={loading}
        />
        <StatCard
          label={isCustomer ? "My Resolved" : "Resolved / Closed"}
          value={resolved}
          icon={<CheckCircle size={20} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          trend="From fetched records"
          loading={loading}
        />
        {!isCustomer && (
          <StatCard
            label="Satisfaction"
            value="98%"
            icon={<Smile size={20} className="text-amber-500" />}
            iconBg="bg-amber-50"
            trend="Based on surveys"
            trendPositive
            loading={loading}
          />
        )}
      </div>

      {/* ── Tickets Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-800">
              {isCustomer ? "My Recent Tickets" : "Recent Tickets"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Last 10 records</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold ring-1 ring-inset ring-indigo-200">
            {role}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
            <span className="text-sm">Loading tickets...</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
            <AlertCircle size={28} />
            <span className="text-sm text-center max-w-sm">{error}</span>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Ticket size={36} className="opacity-20" />
            <span className="text-sm">No tickets found.</span>
          </div>
        )}

        {/* Table */}
        {!loading && !error && tickets.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Title</th>
                  <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-3 py-3">Priority</th>
                  <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-3 py-3">Status</th>
                  <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-3 py-3">Created</th>
                  {isAdmin && (
                    <th className="text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="font-medium text-slate-800 truncate">{ticket.title}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{ticket.description}</p>
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap text-slate-500 text-xs">
                      {formatDate(ticket.createdAt)}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setDeleteTarget(ticket)}
                          title="Delete ticket"
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
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
