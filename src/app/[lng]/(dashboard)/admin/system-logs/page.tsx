"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { Header } from "@/components/dashboard/header";
import { api } from "@/lib/api/client";
import { handleApiError } from "@/lib/toast";

interface SystemLog {
  id: string;
  clinic_id: string | null;
  service: string;
  event: string;
  status: "success" | "failed" | "warning";
  payload: any;
  error: string;
  duration_ms: number;
  created_at: string;
}

interface SystemLogResponse {
  data: SystemLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

const STATUS_CONFIG = {
  success: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
  failed: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50" },
};

interface SystemLogsPageProps {
  params: Promise<{ lng: string }>;
}

export default function SystemLogsPage({ params }: SystemLogsPageProps) {
  const [lng, setLng] = useState("pt-BR");
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    service: "",
    status: "",
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
      if (filters.service) params.service = filters.service;
      if (filters.status) params.status = filters.status;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response: SystemLogResponse = await api.getSystemLogs(params);
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
      <Header lng={lng} title="System Logs" />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Servico</label>
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={filters.service}
              onChange={(e) => setFilters({ ...filters, service: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="whatsapp_worker">WhatsApp Worker</option>
              <option value="message_sender">Message Sender</option>
              <option value="reminder_worker">Reminder Worker</option>
              <option value="timeout_worker">Timeout Worker</option>
              <option value="payment_webhook">Payment Webhook</option>
              <option value="ai_agent">AI Agent</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="warning">Warning</option>
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

        {/* Logs list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Nenhum log encontrado</div>
            ) : (
              logs.map((log) => {
                const config = STATUS_CONFIG[log.status] || STATUS_CONFIG.warning;
                const Icon = config.icon;
                const isExpanded = expandedId === log.id;

                return (
                  <div
                    key={log.id}
                    className={`border rounded-lg overflow-hidden ${config.bg}`}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">{log.service}</span>
                          <span className="text-gray-400 text-xs">-</span>
                          <span className="text-sm text-gray-600">{log.event}</span>
                          {log.duration_ms > 0 && (
                            <span className="text-xs text-gray-400">{log.duration_ms}ms</span>
                          )}
                        </div>
                        {log.error && (
                          <p className="text-xs text-red-600 truncate mt-0.5">{log.error}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </span>
                    </button>
                    {isExpanded && log.payload && (
                      <div className="px-4 pb-3 border-t">
                        <pre className="bg-white/80 p-3 rounded-md text-xs overflow-auto mt-2">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
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
    </div>
  );
}
