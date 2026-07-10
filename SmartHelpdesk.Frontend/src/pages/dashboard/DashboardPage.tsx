import { useEffect, useState } from "react";
import {
  Ticket, Clock, CheckCircle, Smile, Trash2,
  AlertCircle, Loader2, ArrowUpRight, TrendingDown,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { ticketService, type TicketDto } from "../../services/ticketService";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { useToast } from "../../hooks/use-toast";

// ─── Config maps ──────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; dot: string; text: string }> = {
  Open:       { label: "Open",        dot: "bg-rose-400",   text: "text-rose-700" },
  InProgress: { label: "In Progress", dot: "bg-amber-400",  text: "text-amber-700" },
  Resolved:   { label: "Resolved",    dot: "bg-green-400",  text: "text-green-700" },
  Closed:     { label: "Closed",      dot: "bg-gray-400",   text: "text-gray-600" },
};

const PRIORITY_MAP: Record<string, { label: string; cls: string }> = {
  Urgent: { label: "Urgent", cls: "text-rose-600 font-medium" },
  High:   { label: "High",   cls: "text-orange-600 font-medium" },
  Medium: { label: "Medium", cls: "text-blue-600" },
  Low:    { label: "Low",    cls: "text-gray-500" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, dot: "bg-gray-400", text: "text-gray-600" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${cfg.text}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function PriorityLabel({ priority }: { priority: string }) {
  const cfg = PRIORITY_MAP[priority] ?? { label: priority, cls: "text-gray-500" };
  return <span className={`text-[12px] ${cfg.cls}`}>{cfg.label}</span>;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
  color?: string;
}

function StatCard({ label, value, icon, trend, trendUp, loading, color = "text-gray-400" }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <span className={`${color}`}>{icon}</span>
      </div>
      <div>
        <div className="text-[28px] font-bold text-gray-900 leading-none tracking-tight">
          {loading ? <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" /> : value}
        </div>
        {trend && !loading && (
          <p className={`mt-1.5 text-[11px] flex items-center gap-0.5 font-medium ${trendUp ? "text-green-600" : "text-gray-400"}`}>
            {trendUp ? <ArrowUpRight size={11} /> : <TrendingDown size={11} />}
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const role = user?.role ?? "Customer";
  const isAdmin = role === "Admin";
  const isCustomer = role === "Customer";

  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TicketDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    ticketService.getTickets({ pageNumber: 1, pageSize: 10 })
      .then(r => { if (!cancelled) setTickets(r.items ?? []); })
      .catch(() => { if (!cancelled) setError("Could not load tickets. Ensure the backend is running."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const total    = tickets.length;
  const open     = tickets.filter(t => t.status === "Open").length;
  const resolved = tickets.filter(t => t.status === "Resolved" || t.status === "Closed").length;

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await ticketService.deleteTicket(deleteTarget.id);
      setTickets(prev => prev.filter(t => t.id !== deleteTarget.id));
      toast({ title: "Ticket deleted", description: `"${deleteTarget.title}" was removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Error", description: "Could not delete ticket.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
          {isCustomer ? "My Dashboard" : "Overview"}
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          Welcome back, <span className="font-medium text-gray-700">{user?.fullName}</span>.{" "}
          {isCustomer ? "Here are your support tickets." : "Here's what's happening today."}
        </p>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 ${isCustomer ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"}`}>
        <StatCard label={isCustomer ? "My Tickets" : "Total Tickets"} value={total} icon={<Ticket size={16} />} trend="+12% vs last month" trendUp loading={loading} color="text-blue-400" />
        <StatCard label={isCustomer ? "Open" : "Open Tickets"} value={open} icon={<Clock size={16} />} trend={open > 0 ? "Needs attention" : "All clear"} trendUp={open === 0} loading={loading} color="text-rose-400" />
        <StatCard label={isCustomer ? "Resolved" : "Resolved / Closed"} value={resolved} icon={<CheckCircle size={16} />} trend="From current records" loading={loading} color="text-green-400" />
        {!isCustomer && (
          <StatCard label="Satisfaction" value="98%" icon={<Smile size={16} />} trend="Based on recent surveys" trendUp loading={loading} color="text-amber-400" />
        )}
      </div>

      {/* Table section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">{isCustomer ? "Recent Tickets" : "Latest Activity"}</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">Last 10 records fetched</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1">
            {role}
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={22} className="animate-spin text-gray-300" />
              <span className="text-[13px] text-gray-400">Loading tickets...</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
              <AlertCircle size={22} />
              <span className="text-[13px] text-center max-w-xs text-gray-500">{error}</span>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && tickets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                <Ticket size={22} className="text-gray-300" />
              </div>
              <p className="text-[13px] text-gray-500 font-medium">No tickets yet</p>
              <p className="text-[12px] text-gray-400">Tickets will appear here once created.</p>
            </div>
          )}

          {/* Data table */}
          {!loading && !error && tickets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Ticket</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Priority</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Created</th>
                    {isAdmin && <th className="px-5 py-3" />}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(ticket => (
                    <tr key={ticket.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors group last:border-0">
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] font-medium text-gray-900 truncate max-w-[280px]">{ticket.title}</p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[280px] mt-0.5">{ticket.description}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusDot status={ticket.status} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <PriorityLabel priority={ticket.priority} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-[12px] text-gray-500">
                        {formatDate(ticket.createdAt)}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setDeleteTarget(ticket)}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={14} />
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

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => { if (!deleting) setDeleteTarget(null); }}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Ticket"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete Ticket"
      />
    </div>
  );
}
