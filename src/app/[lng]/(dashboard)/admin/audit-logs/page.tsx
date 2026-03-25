"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";

import { Header } from "@/components/dashboard/header";
import { api } from "@/lib/api/client";
import { handleApiError } from "@/lib/toast";

interface AuditLog {
  id: string;
  clinic_id: string;
  user_id: string;
  user_email: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: any;
  new_data: any;
  ip: string;
  user_agent: string;
  created_at: string;
}

interface AuditLogResponse {
  data: AuditLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  LOGIN: "bg-purple-100 text-purple-800",
  LOGOUT: "bg-gray-100 text-gray-800",
};

interface AuditLogsPageProps {
  params: Promise<{ lng: string }>;
}

export default function AuditLogsPage({ params }: AuditLogsPageProps) {
  const [lng, setLng] = useState("pt-BR");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [filters, setFilters] = useState({
    action: "",
    entity_type: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    params.then((p) => setLng(p.lng));
  }, [params]);

  const fetchLogs = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (filters.action) params.action = filters.action;
      if (filters.entity_type) params.entity_type = filters.entity_type;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response: AuditLogResponse = await api.getAuditLogs(params);
      setLogs(response.data || []);
      setMeta(response.meta);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="flex flex-col h-full">
      <Header lng={lng} title="Audit Logs" />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Acao</label>
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            >
              <option value="">Todas</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Entidade</label>
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={filters.entity_type}
              onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
            >
              <option value="">Todas</option>
              <option value="USER">USER</option>
              <option value="PATIENT">PATIENT</option>
              <option value="APPOINTMENT">APPOINTMENT</option>
              <option value="PROFESSIONAL">PROFESSIONAL</option>
              <option value="CLINIC">CLINIC</option>
              <option value="SETTINGS">SETTINGS</option>
              <option value="INVITE">INVITE</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">De</label>
            <input
              type="date"
              className="border rounded-md px-3 py-2 text-sm"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ate</label>
            <input
              type="date"
              className="border rounded-md px-3 py-2 text-sm"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </div>
          <button
            onClick={() => fetchLogs(1)}
            className="bg-primary text-white px-4 py-2 rounded-md text-sm flex items-center gap-1"
          >
            <Search className="w-4 h-4" />
            Filtrar
          </button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Acao</th>
                  <th className="px-4 py-3 text-left">Entidade</th>
                  <th className="px-4 py-3 text-left">IP</th>
                  <th className="px-4 py-3 text-center">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Nenhum log encontrado
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{log.user_email}</div>
                        <div className="text-xs text-gray-400">{log.user_role}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800"}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{log.entity_type}</div>
                        <div className="text-xs text-gray-400 font-mono">{log.entity_id?.slice(0, 8)}...</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.ip}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.total_pages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {meta.total} registro(s) - Pagina {meta.page} de {meta.total_pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchLogs(meta.page - 1)}
                disabled={meta.page <= 1}
                className="p-2 border rounded-md disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchLogs(meta.page + 1)}
                disabled={meta.page >= meta.total_pages}
                className="p-2 border rounded-md disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Detalhes do Audit Log</h3>
              <button onClick={() => setSelectedLog(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Usuario:</span>
                  <p className="font-medium">{selectedLog.user_email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Role:</span>
                  <p className="font-medium">{selectedLog.user_role}</p>
                </div>
                <div>
                  <span className="text-gray-500">Acao:</span>
                  <p className="font-medium">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-gray-500">Entidade:</span>
                  <p className="font-medium">{selectedLog.entity_type} ({selectedLog.entity_id})</p>
                </div>
                <div>
                  <span className="text-gray-500">IP:</span>
                  <p className="font-mono">{selectedLog.ip}</p>
                </div>
                <div>
                  <span className="text-gray-500">Data:</span>
                  <p>{new Date(selectedLog.created_at).toLocaleString("pt-BR")}</p>
                </div>
              </div>
              {selectedLog.old_data && (
                <div>
                  <span className="text-sm text-gray-500">Dados anteriores:</span>
                  <pre className="bg-red-50 p-3 rounded-md text-xs overflow-auto mt-1">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.new_data && (
                <div>
                  <span className="text-sm text-gray-500">Dados novos:</span>
                  <pre className="bg-green-50 p-3 rounded-md text-xs overflow-auto mt-1">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.user_agent && (
                <div>
                  <span className="text-sm text-gray-500">User Agent:</span>
                  <p className="text-xs text-gray-400 mt-1 break-all">{selectedLog.user_agent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
