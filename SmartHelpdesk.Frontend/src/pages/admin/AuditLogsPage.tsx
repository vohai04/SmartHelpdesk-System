import { useCallback, useEffect, useState } from "react";
import { FileText } from "@phosphor-icons/react";
import { axiosClient } from "../../api/axiosClient";

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

interface AuditLogDto {
  id: string;
  userId?: string;
  action: string;
  entityName: string;
  entityId: string;
  oldValues?: string;
  newValues?: string;
  createdAt: string;
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async (pageNumber: number) => {
    setLoading(true);
    try {
      const result = await axiosClient.get<unknown, PagedResult<AuditLogDto>>(`/AuditLogs?PageNumber=${pageNumber}&PageSize=20`);
      setLogs(result.items || []);
      setTotalPages(Math.ceil((result.totalCount || 0) / 20));
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchLogs(page), 0);
    return () => clearTimeout(timer);
  }, [page, fetchLogs]);

  const getActionColor = (action: string) => {
    switch (action?.toLowerCase()) {
      case "create": return "bg-[var(--success-subtle)] text-[var(--success)] ";
      case "update": return "bg-[var(--accent-subtle)] text-[var(--accent)] ";
      case "delete":
      case "softdelete": return "bg-[var(--danger-subtle)] text-[var(--danger)] ";
      case "restore": return "bg-[var(--accent-subtle)] text-[var(--accent)] ";
      default: return "bg-[var(--surface-bg)] text-[var(--text-secondary)]";
    }
  };

  return (
    <div className="activity-page workspace-page flex flex-col space-y-6">
      <div className="page-heading">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-[var(--text-primary)]">Activity log</h1>
          <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
            System activity and security logs.
          </p>
        </div>
      </div>

      <div className="bg-[var(--surface-default)] border border-[var(--border-default)] rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="responsive-records w-full text-left border-collapse">
            <thead className="bg-[var(--surface-bg)] backdrop-blur-sm sticky top-0 z-10 border-b border-[var(--border-default)]">
              <tr>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Time</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">User ID</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Action</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">Entity</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider w-full">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--text-secondary)] text-[13px]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[var(--border-default)] border-t-indigo-600 rounded-full animate-spin" />
                      Loading logs...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--text-secondary)]">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[var(--surface-bg)] flex items-center justify-center text-[var(--text-tertiary)]">
                        <FileText size={24} weight="duotone" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-[var(--text-primary)]">No logs found</p>
                        <p className="text-[12px] mt-0.5">There are no audit logs to display.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--surface-bg)] transition-colors group">
                    <td className="py-3 px-4 text-[12px] text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-[12px] text-[var(--text-secondary)]">
                      <span className="font-mono text-[10px] text-[var(--text-secondary)] truncate block max-w-[100px]" title={log.userId || "System"}>
                        {log.userId ? log.userId.split("-")[0] : "System"}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[12px] font-medium text-[var(--text-primary)] whitespace-nowrap">
                      {log.entityName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 text-[11px] font-mono max-w-xl">
                        {log.oldValues && <span className="text-[var(--danger)] bg-[var(--danger-subtle)] px-1.5 py-0.5 rounded break-all">- {log.oldValues}</span>}
                        {log.newValues && <span className="text-[var(--success)] bg-[var(--success-subtle)] px-1.5 py-0.5 rounded break-all">+ {log.newValues}</span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-default)] text-[12px]">
            <span className="text-[var(--text-secondary)]">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-md border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-bg)] disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-md border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-bg)] disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
