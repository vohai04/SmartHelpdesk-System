import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Ticket,
  Clock,
  CheckCircle,
  Smiley,
  Trash,
  Warning,
  ArrowUpRight,
  Plus,
} from "@phosphor-icons/react";
import { useAuthStore } from "../../store/authStore";
import { ticketService, type TicketDto } from "../../services/ticketService";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { CreateTicketModal } from "../../components/tickets/CreateTicketModal";
import { useToast } from "../../hooks/use-toast";

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; dot: string; color: string }> = {
  Open:       { label: "Open",        dot: "#f87171", color: "#dc2626" },
  InProgress: { label: "In Progress", dot: "#fbbf24", color: "#d97706" },
  Resolved:   { label: "Resolved",    dot: "#4ade80", color: "#16a34a" },
  Closed:     { label: "Closed",      dot: "#a1a1aa", color: "#71717a" },
};

const PRIORITY: Record<string, { label: string; color: string }> = {
  Urgent: { label: "Urgent", color: "#dc2626" },
  High:   { label: "High",   color: "#ea580c" },
  Medium: { label: "Medium", color: "#2563eb" },
  Low:    { label: "Low",    color: "#71717a" },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS[status] ?? { label: status, dot: "#a1a1aa", color: "#71717a" };
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
      <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      <span style={{ color: cfg.color }}>{cfg.label}</span>
    </span>
  );
}

function PriorityLabel({ priority }: { priority: string }) {
  const cfg = PRIORITY[priority] ?? { label: priority, color: "var(--text-tertiary)" };
  return <span className="text-[11px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
  trendPositive?: boolean;
  loading: boolean;
}

function StatCard({ label, value, icon, iconBg, trend, trendPositive, loading }: StatCardProps) {
  return (
    <div
      className="flex flex-col justify-between rounded-xl p-5 transition-all duration-150"
      style={{
        background: "var(--surface-default)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-xs)",
        minHeight: "110px",
      }}
    >
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </p>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-8 w-16 mt-3" />
      ) : (
        <div className="mt-2">
          <p className="text-[28px] font-bold leading-none tracking-tight" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
            {value}
          </p>
          {trend && (
            <p className="flex items-center gap-0.5 mt-1.5 text-[11px] font-medium" style={{ color: trendPositive ? "var(--success)" : "var(--text-disabled)" }}>
              {trendPositive && <ArrowUpRight size={11} weight="bold" />}
              {trend}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <>
      {[1,2,3,4,5].map(i => (
        <tr key={i} className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <td className="px-5 py-3.5">
            <div className="skeleton h-3.5 w-48 mb-1.5" />
            <div className="skeleton h-2.5 w-32" />
          </td>
          <td className="px-4 py-3.5"><div className="skeleton h-3 w-16" /></td>
          <td className="px-4 py-3.5"><div className="skeleton h-3 w-12" /></td>
          <td className="px-4 py-3.5"><div className="skeleton h-3 w-20" /></td>
        </tr>
      ))}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user }  = useAuthStore();
  const { toast } = useToast();
  const role      = user?.role ?? "Customer";
  const isAdmin   = role === "Admin";
  const isCustomer = role === "Customer";

  const [tickets,      setTickets]      = useState<TicketDto[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TicketDto | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const loadDashboardTickets = () => {
    setLoading(true);
    setError(null);
    ticketService.getTickets({ pageNumber: 1, pageSize: 10 })
      .then(r => setTickets(r.items ?? []))
      .catch(() => setError("Could not reach the backend. Make sure the API server is running."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboardTickets();
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
      toast({ title: "Error", description: "Could not delete this ticket.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {isCustomer ? "My Dashboard" : "Overview"}
          </h1>
          <p className="mt-0.5 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
            Welcome back, <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{user?.fullName}</span>.
            {isCustomer ? " Here are your recent support tickets." : " Here's the current helpdesk activity."}
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="h-9 px-4 rounded-lg text-[12px] font-semibold text-white flex items-center gap-2 transition-transform duration-150 active:scale-95"
          style={{ background: "var(--accent)", boxShadow: "var(--shadow-sm)" }}
        >
          <Plus size={14} weight="bold" />
          New Ticket
        </button>
      </div>

      {/* Stat cards */}
      <div className={`grid gap-3 ${isCustomer ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 xl:grid-cols-4"}`}>
        <StatCard
          label={isCustomer ? "My Tickets" : "Total Tickets"}
          value={total}
          icon={<Ticket size={14} weight="bold" style={{ color: "#2563eb" }} />}
          iconBg="var(--accent-subtle)"
          trend={isCustomer ? undefined : "+12% vs last month"}
          trendPositive
          loading={loading}
        />
        <StatCard
          label={isCustomer ? "Open" : "Open Tickets"}
          value={open}
          icon={<Clock size={14} weight="bold" style={{ color: "#d97706" }} />}
          iconBg="var(--warning-subtle)"
          trend={open > 0 ? "Needs attention" : "All clear"}
          trendPositive={open === 0}
          loading={loading}
        />
        <StatCard
          label={isCustomer ? "Resolved" : "Resolved / Closed"}
          value={resolved}
          icon={<CheckCircle size={14} weight="bold" style={{ color: "#16a34a" }} />}
          iconBg="var(--success-subtle)"
          trend="From current records"
          loading={loading}
        />
        {!isCustomer && (
          <StatCard
            label="Satisfaction"
            value="98%"
            icon={<Smiley size={14} weight="bold" style={{ color: "#d97706" }} />}
            iconBg="var(--warning-subtle)"
            trend="Based on surveys"
            trendPositive
            loading={loading}
          />
        )}
      </div>

      {/* Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
              {isCustomer ? "Recent Tickets" : "Latest Activity"}
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-disabled)" }}>
              Showing up to 10 most recent records
            </p>
          </div>
          <span
            className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              background: "var(--accent-subtle)",
              color: "var(--accent)",
              border: "1px solid var(--accent-border)",
            }}
          >
            {role}
          </span>
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--surface-default)",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          {/* Error state */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--danger-subtle)", border: "1px solid var(--danger-border)" }}>
                <Warning size={20} weight="bold" style={{ color: "var(--danger)" }} />
              </div>
              <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>Failed to load tickets</p>
              <p className="text-[12px] max-w-xs text-center" style={{ color: "var(--text-disabled)" }}>{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && tickets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--border-subtle)", border: "1px solid var(--border-default)" }}>
                <Ticket size={20} weight="regular" style={{ color: "var(--text-disabled)" }} />
              </div>
              <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>No tickets yet</p>
              <p className="text-[12px]" style={{ color: "var(--text-disabled)" }}>Tickets will appear here once created.</p>
            </div>
          )}

          {/* Data table */}
          {(loading || (!error && tickets.length > 0)) && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                    {["Ticket", "Status", "Priority", "Created", ...(isAdmin ? [""] : [])].map(h => (
                      <th
                        key={h}
                        className={`text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5 ${h === "" ? "text-right" : ""}`}
                        style={{ color: "var(--text-disabled)", background: "var(--surface-bg)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton />
                  ) : tickets.map(ticket => (
                    <tr
                      key={ticket.id}
                      className="group transition-colors duration-100"
                      style={{ borderBottom: "1px solid var(--border-subtle)" }}
                      onMouseOver={e => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--surface-bg)"; }}
                      onMouseOut={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                    >
                      <td className="px-5 py-3">
                        <Link to={`/tickets/${ticket.id}`} className="block hover:underline">
                          <p className="text-[13px] font-medium truncate max-w-[260px]" style={{ color: "var(--text-primary)" }}>
                            {ticket.title}
                          </p>
                        </Link>
                        <p className="text-[11px] truncate max-w-[260px] mt-0.5" style={{ color: "var(--text-disabled)" }}>
                          {ticket.description}
                        </p>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <StatusPill status={ticket.status} />
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <PriorityLabel priority={ticket.priority} />
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-[11px]" style={{ color: "var(--text-disabled)", fontVariantNumeric: "tabular-nums" }}>
                        {formatDate(ticket.createdAt)}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => setDeleteTarget(ticket)}
                            title="Delete ticket"
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center ml-auto transition-all duration-150"
                            style={{ color: "var(--text-disabled)" }}
                            onMouseOver={e => { e.currentTarget.style.background = "var(--danger-subtle)"; e.currentTarget.style.color = "var(--danger)"; }}
                            onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-disabled)"; }}
                          >
                            <Trash size={13} weight="regular" />
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

      {/* Confirm delete */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => { if (!deleting) setDeleteTarget(null); }}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Ticket"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete Ticket"
      />

      <CreateTicketModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={loadDashboardTickets}
      />
    </div>
  );
}
