import { useEffect, useState, useCallback } from "react";
import {
  MagnifyingGlass,
  UserMinus,
  ArrowCounterClockwise,
  CircleNotch,
  Warning,
  Users,
  Funnel,
} from "@phosphor-icons/react";
import { userService, type UserManagementDto } from "../../services/userService";
import { useToast } from "../../hooks/use-toast";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

// ─── Badges ───────────────────────────────────────────────────────────────────
const ROLE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Admin:        { bg: "var(--accent-subtle)",   color: "var(--accent)",   border: "var(--accent-border)" },
  SupportAgent: { bg: "#f0f9ff",                color: "#0369a1",         border: "#bae6fd" },
  Customer:     { bg: "var(--border-subtle)",   color: "var(--text-tertiary)", border: "var(--border-default)" },
};

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_STYLE[role] ?? ROLE_STYLE.Customer;
  return (
    <span
      className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {role === "SupportAgent" ? "Agent" : role}
    </span>
  );
}

function StatusBadge({ isDeleted }: { isDeleted: boolean }) {
  return isDeleted ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
      style={{ background: "var(--danger-subtle)", color: "var(--danger)", border: "1px solid var(--danger-border)" }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--danger)" }} />
      Deleted
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
      style={{ background: "var(--success-subtle)", color: "var(--success)", border: "1px solid var(--success-border)" }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--success)" }} />
      Active
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <>
      {[1,2,3,4,5].map(i => (
        <tr key={i} className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <td className="px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="skeleton w-7 h-7 rounded-full" />
              <div>
                <div className="skeleton h-3.5 w-36 mb-1.5" />
                <div className="skeleton h-2.5 w-28" />
              </div>
            </div>
          </td>
          <td className="px-5 py-3"><div className="skeleton h-3 w-14" /></td>
          <td className="px-5 py-3"><div className="skeleton h-3 w-12" /></td>
          <td className="px-5 py-3"><div className="skeleton h-3 w-20" /></td>
          <td className="px-5 py-3"><div className="skeleton h-5 w-14 rounded-md ml-auto" /></td>
        </tr>
      ))}
    </>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function UsersPage() {
  const { toast } = useToast();

  const [users,         setUsers]         = useState<UserManagementDto[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [keyword,       setKeyword]       = useState("");
  const [showDeleted,   setShowDeleted]   = useState(false);
  const [totalCount,    setTotalCount]    = useState(0);

  const [deleteTarget,  setDeleteTarget]  = useState<UserManagementDto | null>(null);
  const [isDeleting,    setIsDeleting]    = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<UserManagementDto | null>(null);
  const [isRestoring,   setIsRestoring]   = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await userService.getUsers({
        pageNumber: 1,
        pageSize: 50,
        keyword: keyword || undefined,
        includeDeleted: showDeleted,
      });
      setUsers(result.items ?? []);
      setTotalCount(result.totalCount ?? 0);
    } catch {
      setError("Failed to load users. Make sure the backend API is running.");
    } finally {
      setLoading(false);
    }
  }, [keyword, showDeleted]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleSoftDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await userService.softDeleteUser(deleteTarget.id);
      toast({ title: "User deactivated", description: `${deleteTarget.fullName} has been soft-deleted.` });
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast({ title: "Error", description: "Could not delete user.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setIsRestoring(true);
    try {
      await userService.restoreUser(restoreTarget.id);
      toast({ title: "User restored", description: `${restoreTarget.fullName} is now active.` });
      setRestoreTarget(null);
      fetchUsers();
    } catch {
      toast({ title: "Error", description: "Could not restore user.", variant: "destructive" });
    } finally {
      setIsRestoring(false);
    }
  };

  const activeCount  = users.filter(u => !u.isDeleted).length;
  const deletedCount = users.filter(u => u.isDeleted).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Users
        </h1>
        <p className="mt-0.5 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          Manage all user accounts in the system.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",   value: loading ? "-" : totalCount, color: "var(--text-primary)" },
          { label: "Active",  value: loading ? "-" : activeCount, color: "var(--success)" },
          { label: "Deleted", value: loading ? "-" : deletedCount, color: "var(--danger)" },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{ background: "var(--surface-default)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-xs)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-disabled)" }}>{s.label}</p>
            <p className="text-[24px] font-bold leading-none mt-1.5 tracking-tight" style={{ color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div
          className="relative flex items-center flex-1 max-w-xs h-8 px-2.5 rounded-md border transition-all duration-150"
          style={{ background: "var(--surface-default)", borderColor: "var(--border-default)" }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-border)"; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <MagnifyingGlass size={13} weight="regular" className="flex-shrink-0 mr-2" style={{ color: "var(--text-disabled)" }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="flex-1 bg-transparent text-[12px] outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          {loading && keyword && <CircleNotch size={12} className="animate-spin ml-1 flex-shrink-0" style={{ color: "var(--text-disabled)" }} />}
        </div>

        <button
          onClick={() => setShowDeleted(s => !s)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-medium border transition-all duration-150 flex-shrink-0"
          style={{
            background:   showDeleted ? "var(--danger-subtle)"   : "var(--surface-default)",
            borderColor:  showDeleted ? "var(--danger-border)"   : "var(--border-default)",
            color:        showDeleted ? "var(--danger)"           : "var(--text-secondary)",
          }}
        >
          <Funnel size={13} weight={showDeleted ? "fill" : "regular"} />
          {showDeleted ? "Showing deleted" : "Show deleted"}
        </button>
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
            <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>Failed to load users</p>
            <p className="text-[12px] text-center max-w-xs" style={{ color: "var(--text-disabled)" }}>{error}</p>
            <button onClick={fetchUsers} className="text-[12px] font-medium" style={{ color: "var(--accent)" }}>Try again</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "var(--border-subtle)", border: "1px solid var(--border-default)" }}>
              <Users size={20} weight="regular" style={{ color: "var(--text-disabled)" }} />
            </div>
            <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>No users found</p>
            {keyword && <p className="text-[12px]" style={{ color: "var(--text-disabled)" }}>Try a different search.</p>}
          </div>
        )}

        {/* Table */}
        {(loading || (!error && users.length > 0)) && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)", background: "var(--surface-bg)" }}>
                  {["User", "Role", "Status", "Created", "Actions"].map(h => (
                    <th
                      key={h}
                      className={`text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5 ${h === "Actions" ? "text-right" : "text-left"}`}
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
                ) : users.map(u => (
                  <tr
                    key={u.id}
                    className="group transition-colors duration-100"
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      opacity: u.isDeleted ? 0.65 : 1,
                    }}
                    onMouseOver={e => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--surface-bg)"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                          style={{
                            background: u.isDeleted ? "var(--border-default)" : "var(--border-strong)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {(u.fullName ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{u.fullName}</p>
                          <p className="text-[11px] truncate" style={{ color: "var(--text-disabled)" }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <StatusBadge isDeleted={u.isDeleted} />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-[11px]"
                      style={{ color: "var(--text-disabled)", fontVariantNumeric: "tabular-nums" }}>
                      {u.createdAt ? formatDate(u.createdAt) : "-"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {u.isDeleted ? (
                        <button
                          onClick={() => setRestoreTarget(u)}
                          className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md text-[11px] font-medium border transition-all duration-150"
                          style={{ background: "var(--success-subtle)", color: "var(--success)", borderColor: "var(--success-border)" }}
                        >
                          <ArrowCounterClockwise size={11} weight="bold" />
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md text-[11px] font-medium border opacity-0 group-hover:opacity-100 transition-all duration-150"
                          style={{ background: "var(--danger-subtle)", color: "var(--danger)", borderColor: "var(--danger-border)" }}
                        >
                          <UserMinus size={11} weight="bold" />
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => { if (!isDeleting) setDeleteTarget(null); }}
        onConfirm={handleSoftDelete}
        loading={isDeleting}
        title="Deactivate User"
        description={`"${deleteTarget?.fullName}" will be deactivated but not permanently removed. You can restore them later.`}
        confirmLabel="Deactivate"
      />
      <ConfirmModal
        open={!!restoreTarget}
        onClose={() => { if (!isRestoring) setRestoreTarget(null); }}
        onConfirm={handleRestore}
        loading={isRestoring}
        title="Restore User"
        description={`"${restoreTarget?.fullName}" will be reactivated and regain access to the system.`}
        confirmLabel="Restore"
      />
    </div>
  );
}
