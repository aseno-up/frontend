"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
} from "lucide-react";

import { Header } from "@/components/dashboard/header";
import { api } from "@/lib/api/client";
import { handleApiError } from "@/lib/toast";

interface UsageMetric {
  id: string;
  clinic_id: string;
  metric: string;
  value: number;
  date: string;
}

interface MetricSummary {
  clinic_id: string;
  period: string;
  metrics: Record<string, number>;
}

interface UsageMetricResponse {
  data: UsageMetric[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

const METRIC_LABELS: Record<string, string> = {
  appointments_created: "Agendamentos criados",
  appointments_cancelled: "Agendamentos cancelados",
  appointments_no_show: "No-shows",
  appointments_completed: "Consultas realizadas",
  messages_sent: "Mensagens enviadas",
  messages_delivered: "Mensagens entregues",
  messages_failed: "Mensagens falharam",
  messages_confirmed: "Confirmacoes recebidas",
  ai_conversations: "Conversas IA",
  ai_tokens_used: "Tokens IA usados",
  patients_created: "Pacientes criados",
  active_patients: "Pacientes ativos",
};

interface UsageMetricsPageProps {
  params: Promise<{ lng: string }>;
}

export default function UsageMetricsPage({ params }: UsageMetricsPageProps) {
  const [lng, setLng] = useState("pt-BR");
  const [activeTab, setActiveTab] = useState<"raw" | "summary">("summary");
  const [metrics, setMetrics] = useState<UsageMetric[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0, total_pages: 0 });
  const [summaries, setSummaries] = useState<MetricSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setLng(p.lng));
  }, [params]);

  const [filters, setFilters] = useState({
    metric: "",
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getUsageMetricsSummary({
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
      setSummaries(response.data || []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  }, [filters.start_date, filters.end_date]);

  const fetchRaw = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 50 };
      if (filters.metric) params.metric = filters.metric;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response: UsageMetricResponse = await api.getUsageMetrics(params);
      setMetrics(response.data || []);
      setMeta(response.meta);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (activeTab === "summary") {
      fetchSummary();
    } else {
      fetchRaw();
    }
  }, [activeTab, fetchSummary, fetchRaw]);

  return (
    <div className="flex flex-col h-full">
      <Header lng={lng} title="Usage Metrics" />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Tab Switch */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === "summary"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500"
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Resumo por Clinica
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === "raw"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500"
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-1" />
            Dados Brutos
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
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
          {activeTab === "raw" && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Metrica</label>
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={filters.metric}
                onChange={(e) => setFilters({ ...filters, metric: e.target.value })}
              >
                <option value="">Todas</option>
                {Object.entries(METRIC_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => activeTab === "summary" ? fetchSummary() : fetchRaw(1)}
            className="bg-primary text-white px-4 py-2 rounded-md text-sm flex items-center gap-1"
          >
            <Search className="w-4 h-4" />
            Filtrar
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : activeTab === "summary" ? (
          /* Summary View */
          summaries.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Nenhuma metrica registrada neste periodo
            </div>
          ) : (
            <div className="space-y-4">
              {summaries.map((summary) => (
                <div key={summary.clinic_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-gray-400">{summary.clinic_id}</span>
                    <span className="text-xs text-gray-500">{summary.period}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.entries(summary.metrics).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 rounded-md p-3">
                        <div className="text-xs text-gray-500">
                          {METRIC_LABELS[key] || key}
                        </div>
                        <div className="text-lg font-semibold text-gray-900 mt-1">
                          {value.toLocaleString("pt-BR")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Raw Data View */
          <>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Data</th>
                    <th className="px-4 py-3 text-left">Clinic ID</th>
                    <th className="px-4 py-3 text-left">Metrica</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {metrics.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                        Nenhuma metrica encontrada
                      </td>
                    </tr>
                  ) : (
                    metrics.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(m.date).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">
                          {m.clinic_id.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {METRIC_LABELS[m.metric] || m.metric}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {m.value.toLocaleString("pt-BR")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {meta.total_pages > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {meta.total} registro(s) - Pagina {meta.page} de {meta.total_pages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchRaw(meta.page - 1)}
                    disabled={meta.page <= 1}
                    className="p-2 border rounded-md disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fetchRaw(meta.page + 1)}
                    disabled={meta.page >= meta.total_pages}
                    className="p-2 border rounded-md disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
