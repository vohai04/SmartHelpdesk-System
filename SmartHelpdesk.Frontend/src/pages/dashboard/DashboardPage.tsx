import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Ticket,
  Clock,
  CheckCircle,
  Smiley,
  Warning,
  ArrowUpRight,
  Plus,
} from "@phosphor-icons/react";
import { useAuthStore } from "../../store/authStore";
import { ticketService, type TicketDto } from "../../services/ticketService";
import { CreateTicketModal } from "../../components/tickets/CreateTicketModal";
import { analyticsService, type DashboardMetricsDto } from "../../services/analyticsService";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

// ─── Badges ───────────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Open:       { bg: "var(--accent-subtle)",   color: "var(--accent)",   border: "var(--accent-border)" },
  InProgress: { bg: "#fef3c7",                color: "#d97706",         border: "#fde68a" },
  Resolved:   { bg: "var(--success-subtle)",  color: "var(--success)",  border: "var(--success-border)" },
  Closed:     { bg: "var(--border-subtle)",   color: "var(--text-tertiary)", border: "var(--border-default)" },
};

const PRIORITY_COLOR: Record<string, string> = {
  Low:    "var(--text-tertiary)",
  Medium: "var(--text-secondary)",
  High:   "#ea580c",
  Urgent: "var(--danger)",
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.Open;
  return (
    <span
      className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {status === "InProgress" ? "In Progress" : status}
    </span>
  );
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
  const role      = user?.role ?? "Customer";
  const isCustomer = role === "Customer";

  const [tickets,      setTickets]      = useState<TicketDto[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [metrics,      setMetrics]      = useState<DashboardMetricsDto | null>(null);

  const loadDashboardTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, m] = await Promise.all([
        ticketService.getTickets({ pageNumber: 1, pageSize: 10 }),
        !isCustomer ? analyticsService.getDashboardMetrics() : Promise.resolve(null)
      ]);
      setTickets(r.items ?? []);
      if (m) setMetrics(m);
    } catch {
      setError("Could not reach the backend. Make sure the API server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardTickets();
  }, []);

  const total    = tickets.length;
  const open     = tickets.filter(t => t.status === "Open").length;
  const resolved = tickets.filter(t => t.status === "Resolved" || t.status === "Closed").length;

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
          value={isCustomer ? total : metrics?.totalTickets ?? "-"}
          icon={<Ticket size={14} weight="bold" style={{ color: "#2563eb" }} />}
          iconBg="var(--accent-subtle)"
          trend={isCustomer ? undefined : "All time records"}
          trendPositive
          loading={loading}
        />
        <StatCard
          label={isCustomer ? "Open" : "Open Tickets"}
          value={isCustomer ? open : metrics?.openTickets ?? "-"}
          icon={<Clock size={14} weight="bold" style={{ color: "#d97706" }} />}
          iconBg="var(--warning-subtle)"
          trend={isCustomer ? undefined : `${metrics?.urgentTickets ?? 0} Urgent`}
          trendPositive={false}
          loading={loading}
        />
        <StatCard
          label={isCustomer ? "Resolved" : "Avg Resolution Time"}
          value={isCustomer ? resolved : `${metrics?.averageResolutionTimeHours ?? 0}h`}
          icon={<CheckCircle size={14} weight="bold" style={{ color: "#16a34a" }} />}
          iconBg="var(--success-subtle)"
          trend="Overall performance"
          loading={loading}
        />
        {!isCustomer && (
          <StatCard
            label="AI Triage Rate"
            value={`${metrics?.aiTriageRate ?? 0}%`}
            icon={<Smiley size={14} weight="bold" style={{ color: "#8b5cf6" }} />}
            iconBg="#ede9fe"
            trend="Auto-assigned"
            trendPositive
            loading={loading}
          />
        )}
      </div>

      {/* Charts (Admin/Agent only) */}
      {!isCustomer && metrics && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ background: "var(--surface-default)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-xs)" }}>
            <h3 className="text-[13px] font-semibold text-slate-800 mb-4">Tickets by Status</h3>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(metrics.ticketsByStatus).map(([k, v]) => ({ name: k, count: v }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl p-5" style={{ background: "var(--surface-default)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-xs)" }}>
            <h3 className="text-[13px] font-semibold text-slate-800 mb-4">Tickets by Priority</h3>
            <div className="h-[240px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={Object.entries(metrics.ticketsByPriority).map(([k, v]) => ({ name: k, value: v }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {Object.entries(metrics.ticketsByPriority).map((entry, index) => {
                      const colors: Record<string, string> = { Urgent: '#ef4444', High: '#f97316', Medium: '#3b82f6', Low: '#71717a' };
                      return <Cell key={`cell-${index}`} fill={colors[entry[0]] || '#94a3b8'} />;
                    })}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[20px] font-bold text-slate-800 tabular-nums">{metrics.totalTickets}</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    {["Ticket Details", "Status", "Priority", "Assignee", "Created"].map(h => (
                      <th
                        key={h}
                        className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5"
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
                        <Link to={`/tickets/${ticket.id}`} className="block">
                          <p className="text-[13px] font-semibold truncate hover:underline" style={{ color: "var(--text-primary)" }}>
                            {ticket.title}
                          </p>
                          <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-disabled)" }}>
                            #{ticket.id.substring(0,8)} • {ticket.categoryName || "Uncategorized"}
                          </p>
                        </Link>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-[12px] font-medium flex items-center gap-1.5" style={{ color: PRIORITY_COLOR[ticket.priority] }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY_COLOR[ticket.priority] }} />
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-[12px]" style={{ color: ticket.assignedToName ? "var(--text-secondary)" : "var(--text-disabled)" }}>
                          {ticket.assignedToName || "Unassigned"}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-[12px]" style={{ color: "var(--text-disabled)", fontVariantNumeric: "tabular-nums" }}>
                        {formatDate(ticket.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <CreateTicketModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={loadDashboardTickets}
      />
    </div>
  );
}
