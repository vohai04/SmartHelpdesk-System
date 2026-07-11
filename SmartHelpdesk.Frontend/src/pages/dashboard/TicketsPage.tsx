import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MagnifyingGlass,
  Plus,
  Ticket as TicketIcon,
  Warning,
  CircleNotch,
  Funnel
} from "@phosphor-icons/react";
import { ticketService, type TicketDto } from "../../services/ticketService";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CreateTicketModal } from "../../components/tickets/CreateTicketModal";
import { signalRService } from "../../services/signalrService";

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <>
      {[1,2,3,4,5].map(i => (
        <tr key={i} className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <td className="px-5 py-3"><div className="skeleton h-3.5 w-3/4 mb-1.5" /><div className="skeleton h-2.5 w-1/2" /></td>
          <td className="px-5 py-3"><div className="skeleton h-3 w-16" /></td>
          <td className="px-5 py-3"><div className="skeleton h-3 w-12" /></td>
          <td className="px-5 py-3"><div className="skeleton h-3 w-14" /></td>
          <td className="px-5 py-3"><div className="skeleton h-3 w-20" /></td>
        </tr>
      ))}
    </>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function TicketsPage() {
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ticketService.getTickets({
        pageNumber,
        pageSize: 15,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setTickets(result.items ?? []);
      setTotalCount(result.totalCount ?? 0);
      setTotalPages(result.totalPages ?? 1);
    } catch {
      setError("Failed to load tickets. Ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter, priorityFilter, pageNumber]);

  useEffect(() => {
    setPageNumber(1);
  }, [keyword, statusFilter, priorityFilter]);

  useEffect(() => {
    const t = setTimeout(fetchTickets, 300);
    return () => clearTimeout(t);
  }, [fetchTickets]);

  useEffect(() => {
    // Subscribe to SignalR notifications to trigger a realtime refresh
    const unsubscribe = signalRService.subscribe((title, message) => {
      console.log("Realtime notification received:", title, message);
      // Re-fetch tickets to show updated AI priority
      fetchTickets();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchTickets]);

  const hasActiveFilters = statusFilter !== "" || priorityFilter !== "";

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Tickets
          </h1>
          <p className="mt-0.5 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
            Manage and track all support requests.
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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div
          className="relative flex items-center flex-1 max-w-sm h-9 px-3 rounded-md border transition-all duration-150"
          style={{ background: "var(--surface-default)", borderColor: "var(--border-default)" }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-border)"; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <MagnifyingGlass size={14} weight="regular" className="flex-shrink-0 mr-2" style={{ color: "var(--text-disabled)" }} />
          <input
            type="text"
            placeholder="Search tickets by title..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="flex-1 bg-transparent text-[13px] outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          {loading && keyword && <CircleNotch size={14} className="animate-spin ml-1 flex-shrink-0" style={{ color: "var(--text-disabled)" }} />}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="h-9 px-3 rounded-md text-[12px] font-medium border flex items-center gap-2 transition-all duration-150"
                style={{
                  background: statusFilter ? "var(--surface-bg)" : "var(--surface-default)",
                  borderColor: statusFilter ? "var(--border-strong)" : "var(--border-default)",
                  color: statusFilter ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                <Funnel size={14} weight={statusFilter ? "fill" : "regular"} />
                {statusFilter ? `Status: ${statusFilter}` : "Status"}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[140px] rounded-xl p-1 shadow-lg animate-in fade-in zoom-in-95 duration-150"
                style={{ background: "var(--surface-default)", border: "1px solid var(--border-default)", zIndex: "var(--z-dropdown)" }}
                align="end"
                sideOffset={4}
              >
                {[
                  { label: "All Statuses", value: "" },
                  { label: "Open", value: "Open" },
                  { label: "In Progress", value: "InProgress" },
                  { label: "Resolved", value: "Resolved" },
                  { label: "Closed", value: "Closed" },
                ].map((item) => (
                  <DropdownMenu.Item
                    key={item.label}
                    className="flex items-center px-3 py-1.5 text-[12px] font-medium rounded-lg outline-none cursor-pointer data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-neutral-800 transition-colors"
                    style={{ color: statusFilter === item.value ? "var(--accent)" : "var(--text-secondary)" }}
                    onClick={() => setStatusFilter(item.value)}
                  >
                    {item.label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Priority Filter */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="h-9 px-3 rounded-md text-[12px] font-medium border flex items-center gap-2 transition-all duration-150"
                style={{
                  background: priorityFilter ? "var(--surface-bg)" : "var(--surface-default)",
                  borderColor: priorityFilter ? "var(--border-strong)" : "var(--border-default)",
                  color: priorityFilter ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                <Funnel size={14} weight={priorityFilter ? "fill" : "regular"} />
                {priorityFilter ? `Priority: ${priorityFilter}` : "Priority"}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[140px] rounded-xl p-1 shadow-lg animate-in fade-in zoom-in-95 duration-150"
                style={{ background: "var(--surface-default)", border: "1px solid var(--border-default)", zIndex: "var(--z-dropdown)" }}
                align="end"
                sideOffset={4}
              >
                {[
                  { label: "All Priorities", value: "" },
                  { label: "Urgent", value: "Urgent" },
                  { label: "High", value: "High" },
                  { label: "Medium", value: "Medium" },
                  { label: "Low", value: "Low" },
                ].map((item) => (
                  <DropdownMenu.Item
                    key={item.label}
                    className="flex items-center px-3 py-1.5 text-[12px] font-medium rounded-lg outline-none cursor-pointer data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-neutral-800 transition-colors"
                    style={{ color: priorityFilter === item.value ? "var(--accent)" : "var(--text-secondary)" }}
                    onClick={() => setPriorityFilter(item.value)}
                  >
                    {item.label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {hasActiveFilters && (
            <button
              onClick={() => { setStatusFilter(""); setPriorityFilter(""); }}
              className="h-9 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--surface-default)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "var(--danger-subtle)", border: "1px solid var(--danger-border)" }}>
              <Warning size={20} weight="bold" style={{ color: "var(--danger)" }} />
            </div>
            <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>Failed to load tickets</p>
            <p className="text-[12px] text-center max-w-xs" style={{ color: "var(--text-disabled)" }}>{error}</p>
            <button onClick={fetchTickets} className="text-[12px] font-medium" style={{ color: "var(--accent)" }}>Try again</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "var(--border-subtle)", border: "1px solid var(--border-default)" }}>
              <TicketIcon size={20} weight="regular" style={{ color: "var(--text-disabled)" }} />
            </div>
            <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>No tickets found</p>
            {(keyword || hasActiveFilters) && <p className="text-[12px]" style={{ color: "var(--text-disabled)" }}>Try adjusting your search or filters.</p>}
          </div>
        )}

        {/* Table List */}
        {(loading || (!error && tickets.length > 0)) && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)", background: "var(--surface-bg)" }}>
                  {["Ticket Details", "Status", "Priority", "Assignee", "Created"].map(h => (
                    <th
                      key={h}
                      className="text-[11px] font-semibold uppercase tracking-wider px-5 py-3 text-left"
                      style={{ color: "var(--text-disabled)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <RowSkeleton />
                ) : tickets.map(t => (
                  <tr
                    key={t.id}
                    className="group transition-colors duration-100"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    onMouseOver={e => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--surface-bg)"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                  >
                    <td className="px-5 py-3">
                      <Link to={`/dashboard/tickets/${t.id}`} className="block">
                        <p className="text-[13px] font-semibold truncate hover:underline" style={{ color: "var(--text-primary)" }}>
                          {t.title}
                        </p>
                        <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-disabled)" }}>
                          #{t.id.substring(0,8)} • {t.categoryName || "Uncategorized"}
                        </p>
                      </Link>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-[12px] font-medium flex items-center gap-1.5" style={{ color: PRIORITY_COLOR[t.priority] }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY_COLOR[t.priority] }} />
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-[12px]" style={{ color: t.assignedToName ? "var(--text-secondary)" : "var(--text-disabled)" }}>
                        {t.assignedToName || "Unassigned"}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-[12px]" style={{ color: "var(--text-disabled)", fontVariantNumeric: "tabular-nums" }}>
                      {t.createdAt ? formatDate(t.createdAt) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface-bg)" }}>
                <span className="text-[11px]" style={{ color: "var(--text-disabled)" }}>
                  Showing page {pageNumber} of {totalPages} ({totalCount} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber(p => p - 1)}
                    className="h-7 px-3 rounded-md text-[11px] font-semibold border disabled:opacity-50 transition-colors"
                    style={{ background: "var(--surface-default)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
                  >
                    Previous
                  </button>
                  <button
                    disabled={pageNumber >= totalPages}
                    onClick={() => setPageNumber(p => p + 1)}
                    className="h-7 px-3 rounded-md text-[11px] font-semibold border disabled:opacity-50 transition-colors"
                    style={{ background: "var(--surface-default)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateTicketModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchTickets}
      />
    </div>
  );
}
