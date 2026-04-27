"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Cpu,
  Copy,
  Check,
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

interface AITokenModelRow {
  clinic_id: string;
  provider: string;
  model: string;
  calls: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_brl: number;
}

interface AITokenModelResponse {
  data: AITokenModelRow[];
  period: string;
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

interface ClinicLookup {
  id: string;
  name: string;
}

function ClinicCell({ clinicId, clinicName }: { clinicId: string; clinicName?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(clinicId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API can fail in non-secure contexts; silently ignore
    }
  };
  return (
    <div className="flex items-center gap-2">
      {clinicName ? (
        <span className="text-gray-900 font-medium">{clinicName}</span>
      ) : (
        <span className="font-mono text-xs text-gray-400">{clinicId.slice(0, 8)}…</span>
      )}
      <button
        type="button"
        onClick={handleCopy}
        title={`Copiar ${clinicId}`}
        className="text-gray-400 hover:text-gray-700 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

interface UsageMetricsPageProps {
  params: Promise<{ lng: string }>;
}

export default function UsageMetricsPage({ params }: UsageMetricsPageProps) {
  const [lng, setLng] = useState("pt-BR");
  const [activeTab, setActiveTab] = useState<"raw" | "summary" | "ai_models">("summary");
  const [metrics, setMetrics] = useState<UsageMetric[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0, total_pages: 0 });
  const [summaries, setSummaries] = useState<MetricSummary[]>([]);
  const [aiModelRows, setAiModelRows] = useState<AITokenModelRow[]>([]);
  const [costByClinic, setCostByClinic] = useState<Record<string, number>>({});
  const [tokensByClinic, setTokensByClinic] = useState<Record<string, number>>({});
  const [clinicNameById, setClinicNameById] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setLng(p.lng));
  }, [params]);

  useEffect(() => {
    // Cached clinic lookup so all 3 tabs can render names instead of UUIDs.
    // Fetched once on mount; admin scope is small and rarely changes within a session.
    api
      .getAdminClinicsLookup()
      .then((response: { data?: ClinicLookup[] }) => {
        const map: Record<string, string> = {};
        for (const c of response.data ?? []) map[c.id] = c.name;
        setClinicNameById(map);
      })
      .catch(() => {
        // If the lookup fails, the cell falls back to the truncated UUID.
        setClinicNameById({});
      });
  }, []);

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

      // Aggregate AI cost per clinic for the same period so the analyst can
      // see "how much did each clinic spend on IA?" alongside the raw rows.
      // Cost is best-effort (EstimateTokenCost in backend); see the IA por
      // Modelo tab for the exact provider/model breakdown.
      const aiResp: AITokenModelResponse = await api.getAITokenUsageByModel({
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
      const totals: Record<string, number> = {};
      const tokens: Record<string, number> = {};
      for (const r of aiResp.data ?? []) {
        totals[r.clinic_id] = (totals[r.clinic_id] ?? 0) + r.cost_brl;
        tokens[r.clinic_id] = (tokens[r.clinic_id] ?? 0) + r.total_tokens;
      }
      setCostByClinic(totals);
      setTokensByClinic(tokens);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchAIModels = useCallback(async () => {
    setIsLoading(true);
    try {
      const response: AITokenModelResponse = await api.getAITokenUsageByModel({
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
      setAiModelRows(response.data || []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  }, [filters.start_date, filters.end_date]);

  useEffect(() => {
    if (activeTab === "summary") {
      fetchSummary();
    } else if (activeTab === "ai_models") {
      fetchAIModels();
    } else {
      fetchRaw();
    }
  }, [activeTab, fetchSummary, fetchRaw, fetchAIModels]);

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
          <button
            onClick={() => setActiveTab("ai_models")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === "ai_models"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500"
            }`}
          >
            <Cpu className="w-4 h-4 inline mr-1" />
            IA por Modelo
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
            onClick={() => {
              if (activeTab === "summary") fetchSummary();
              else if (activeTab === "ai_models") fetchAIModels();
              else fetchRaw(1);
            }}
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
        ) : activeTab === "ai_models" ? (
          /* AI per-model breakdown */
          aiModelRows.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Nenhum consumo de IA registrado neste periodo
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Clinica</th>
                    <th className="px-4 py-3 text-left">Provider</th>
                    <th className="px-4 py-3 text-left">Modelo</th>
                    <th className="px-4 py-3 text-right">Chamadas</th>
                    <th className="px-4 py-3 text-right">Input</th>
                    <th className="px-4 py-3 text-right">Output</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Custo (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {aiModelRows.map((r, i) => (
                    <tr key={`${r.clinic_id}-${r.provider}-${r.model}-${i}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <ClinicCell clinicId={r.clinic_id} clinicName={clinicNameById[r.clinic_id]} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.provider}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{r.model}</td>
                      <td className="px-4 py-3 text-right">{r.calls.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {r.input_tokens.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {r.output_tokens.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {r.total_tokens.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {r.cost_brl.toLocaleString("pt-BR", {
                          minimumFractionDigits: 4,
                          maximumFractionDigits: 4,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
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
                    <ClinicCell clinicId={summary.clinic_id} clinicName={clinicNameById[summary.clinic_id]} />
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
            {Object.keys(costByClinic).length > 0 && (
              <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-2">
                    Total IA no periodo (todas as clinicas, estimativa)
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <div className="text-xs text-gray-500">Custo total</div>
                      <div className="text-2xl font-bold text-gray-900 tabular-nums">
                        R${" "}
                        {Object.values(costByClinic)
                          .reduce((acc, v) => acc + v, 0)
                          .toLocaleString("pt-BR", {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 4,
                          })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Tokens totais</div>
                      <div className="text-2xl font-bold text-gray-900 tabular-nums">
                        {Object.values(tokensByClinic)
                          .reduce((acc, v) => acc + v, 0)
                          .toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-2">
                    Por clinica
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(costByClinic)
                      .sort(([, a], [, b]) => b - a)
                      .map(([clinicId, total]) => (
                        <div
                          key={clinicId}
                          className="flex items-center justify-between bg-white border rounded-md px-3 py-2"
                        >
                          <ClinicCell clinicId={clinicId} clinicName={clinicNameById[clinicId]} />
                          <div className="text-right">
                            <div className="font-semibold text-gray-900 tabular-nums">
                              R${" "}
                              {total.toLocaleString("pt-BR", {
                                minimumFractionDigits: 4,
                                maximumFractionDigits: 4,
                              })}
                            </div>
                            <div className="text-xs text-gray-500 tabular-nums">
                              {(tokensByClinic[clinicId] ?? 0).toLocaleString("pt-BR")} tokens
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Data</th>
                    <th className="px-4 py-3 text-left">Clinica</th>
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
                        <td className="px-4 py-3">
                          <ClinicCell clinicId={m.clinic_id} clinicName={clinicNameById[m.clinic_id]} />
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
