import { useEffect, useState, useCallback } from "react";
import { Search, UserX, RotateCcw, Loader2, AlertCircle, Users, Filter } from "lucide-react";
import { userService, type UserManagementDto } from "../../services/userService";
import { useToast } from "../../hooks/use-toast";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    Admin:         "bg-purple-50 text-purple-700 border-purple-200",
    SupportAgent:  "bg-blue-50   text-blue-700   border-blue-200",
    Customer:      "bg-gray-50   text-gray-600   border-gray-200",
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${map[role] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {role}
    </span>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ isDeleted }: { isDeleted: boolean }) {
  return isDeleted ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
      Deleted
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
      Active
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function UsersPage() {
  const { toast } = useToast();

  const [users, setUsers]               = useState<UserManagementDto[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [keyword, setKeyword]           = useState("");
  const [showDeleted, setShowDeleted]   = useState(false);
  const [totalCount, setTotalCount]     = useState(0);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<UserManagementDto | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  // Restore confirm state
  const [restoreTarget, setRestoreTarget] = useState<UserManagementDto | null>(null);
  const [isRestoring, setIsRestoring]     = useState(false);

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
      setError("Failed to load users. Ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [keyword, showDeleted]);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleSoftDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await userService.softDeleteUser(deleteTarget.id);
      toast({ title: "User deleted", description: `${deleteTarget.fullName} has been soft-deleted.` });
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
      toast({ title: "User restored", description: `${restoreTarget.fullName} has been restored.` });
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
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Users</h1>
        <p className="text-[13px] text-gray-500 mt-1">Manage all user accounts in the system.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Users</p>
          <p className="text-[26px] font-bold text-gray-900 mt-1">{loading ? "—" : totalCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Active</p>
          <p className="text-[26px] font-bold text-green-600 mt-1">{loading ? "—" : activeCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Deleted</p>
          <p className="text-[26px] font-bold text-red-500 mt-1">{loading ? "—" : deletedCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="w-full h-[36px] pl-8 pr-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 transition-all"
          />
        </div>

        <button
          onClick={() => setShowDeleted(s => !s)}
          className={`flex items-center gap-2 h-[36px] px-3.5 text-[13px] font-medium rounded-lg border transition-all ${
            showDeleted
              ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Filter size={13} />
          {showDeleted ? "Hiding deleted" : "Show deleted"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader2 size={22} className="animate-spin text-gray-300" />
            <span className="text-[13px] text-gray-400">Loading users...</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
            <AlertCircle size={22} />
            <span className="text-[13px] text-gray-500 text-center max-w-xs">{error}</span>
            <button onClick={fetchUsers} className="text-[13px] text-blue-600 font-medium hover:underline">Try again</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
              <Users size={22} className="text-gray-300" />
            </div>
            <p className="text-[13px] text-gray-500 font-medium">No users found</p>
            {keyword && <p className="text-[12px] text-gray-400">Try a different search term.</p>}
          </div>
        )}

        {/* Data */}
        {!loading && !error && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-5 py-3">User</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-4 py-3">Role</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-4 py-3">Status</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-4 py-3">Created</th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr
                    key={u.id}
                    className={`border-b border-gray-50 last:border-0 transition-colors group ${u.isDeleted ? "opacity-60 bg-red-50/30" : "hover:bg-gray-50/50"}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${u.isDeleted ? "bg-gray-100 text-gray-400" : "bg-gray-100 text-gray-700"}`}>
                          {u.fullName?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-gray-900 truncate">{u.fullName}</p>
                          <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge isDeleted={u.isDeleted} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-[12px] text-gray-500">
                      {u.createdAt ? formatDate(u.createdAt) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {u.isDeleted ? (
                        <button
                          onClick={() => setRestoreTarget(u)}
                          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-green-600 hover:text-green-700 hover:bg-green-50 px-2.5 py-1 rounded-lg transition-all"
                        >
                          <RotateCcw size={12} />
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <UserX size={12} />
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

      {/* Soft delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => { if (!isDeleting) setDeleteTarget(null); }}
        onConfirm={handleSoftDelete}
        loading={isDeleting}
        title="Soft Delete User"
        description={`"${deleteTarget?.fullName}" will be deactivated but not permanently removed. You can restore them later.`}
        confirmLabel="Delete User"
      />

      {/* Restore confirm */}
      <ConfirmModal
        open={!!restoreTarget}
        onClose={() => { if (!isRestoring) setRestoreTarget(null); }}
        onConfirm={handleRestore}
        loading={isRestoring}
        title="Restore User"
        description={`"${restoreTarget?.fullName}" will be reactivated and regain access to the system.`}
        confirmLabel="Restore User"
      />
    </div>
  );
}
