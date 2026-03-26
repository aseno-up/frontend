"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Search,
  DollarSign,
  Users,
  TrendingUp,
  Target,
} from "lucide-react";

import { Header } from "@/components/dashboard/header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api/client";
import { handleApiError } from "@/lib/toast";
import type { Lead, LeadStatus, LeadChannel } from "@/types/api";
import { LeadSheet } from "./components/lead-sheet";

const STATUS_OPTIONS: { value: LeadStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "identificado", label: "Identificado" },
  { value: "contactado", label: "Contactado" },
  { value: "respondeu", label: "Respondeu" },
  { value: "demo_agendada", label: "Demo Agendada" },
  { value: "trial_ativo", label: "Trial Ativo" },
  { value: "negociando", label: "Negociando" },
  { value: "convertido", label: "Convertido" },
  { value: "sem_resposta", label: "Sem Resposta" },
  { value: "descartado", label: "Descartado" },
];

const CHANNEL_OPTIONS: { value: LeadChannel | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "outbound", label: "Outbound" },
  { value: "inbound", label: "Inbound" },
];

const STATUS_COLORS: Record<LeadStatus, string> = {
  identificado: "bg-gray-100 text-gray-700",
  contactado: "bg-blue-100 text-blue-700",
  respondeu: "bg-cyan-100 text-cyan-700",
  demo_agendada: "bg-purple-100 text-purple-700",
  trial_ativo: "bg-yellow-100 text-yellow-700",
  negociando: "bg-orange-100 text-orange-700",
  convertido: "bg-green-100 text-green-700",
  sem_resposta: "bg-red-100 text-red-700",
  descartado: "bg-red-200 text-red-800",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  identificado: "Identificado",
  contactado: "Contactado",
  respondeu: "Respondeu",
  demo_agendada: "Demo Agendada",
  trial_ativo: "Trial Ativo",
  negociando: "Negociando",
  convertido: "Convertido",
  sem_resposta: "Sem Resposta",
  descartado: "Descartado",
};

interface LeadsPageProps {
  params: Promise<{ lng: string }>;
}

interface DashboardData {
  leads_by_status: { status: string; count: number }[];
  total_mrr: number;
  total_clinic_mrr: number;
  total_leads: number;
  converted_leads: number;
  active_trials: number;
  clinics: {
    id: string;
    name: string;
    owner_name: string;
    email: string;
    phone: string;
    plan_name: string;
    subscription_status: string;
    mrr: number;
    created_at: string;
  }[];
  clinics_per_plan: { plan_name: string; count: number }[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("pt-BR");
};

export default function LeadsPage({ params }: LeadsPageProps) {
  const [lng, setLng] = useState("pt-BR");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const [activeTab, setActiveTab] = useState("leads");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const channel = searchParams.get("channel") || "";

  useEffect(() => {
    params.then((p) => setLng(p.lng));
  }, [params]);

  const updateQueryParams = useCallback(
    (updates: Record<string, string | null>) => {
      const p = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          p.delete(key);
        } else {
          p.set(key, value);
        }
      });
      if (!updates.page) p.set("page", "1");
      router.push(pathname + "?" + p.toString(), { scroll: false });
    },
    [searchParams, pathname, router]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== search) {
        updateQueryParams({ search: searchInput || null });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput, search, updateQueryParams]);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams: Record<string, string | number> = { page, limit };
      if (search) queryParams.search = search;
      if (status) queryParams.status = status;
      if (channel) queryParams.channel = channel;

      const response = await api.getLeads(queryParams);
      setLeads(response.data || []);
      setTotal(response.meta?.total || 0);
      setTotalPages(response.meta?.total_pages || 0);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, status, channel]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const fetchDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const data = await api.getCRMDashboard();
      setDashboard(data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboard();
    }
  }, [activeTab, fetchDashboard]);

  const handleCreate = () => {
    setEditingLead(null);
    setSheetOpen(true);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setSheetOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingLeadId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLeadId) return;
    setIsDeleting(true);
    try {
      await api.deleteLead(deletingLeadId);
      fetchLeads();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingLeadId(null);
    }
  };

  const handleSaved = () => {
    setSheetOpen(false);
    setEditingLead(null);
    fetchLeads();
  };

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="CRM Leads" />

      <div className="flex-1 p-4 md:p-6 flex flex-col overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between shrink-0 mb-4">
            <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #e8eaed", paddingBottom: 16 }}>
              <TabButton active={activeTab === "leads"} onClick={() => setActiveTab("leads")} icon={<Target style={{ width: 16, height: 16 }} />}>
                Leads
              </TabButton>
              <TabButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<TrendingUp style={{ width: 16, height: 16 }} />}>
                Dashboard
              </TabButton>
            </div>
            {activeTab === "leads" && (
              <button
                onClick={handleCreate}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Novo Lead
              </button>
            )}
          </div>

          {/* === TAB LEADS === */}
          {activeTab === "leads" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 shrink-0 mb-4">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nome, telefone, cidade..."
                  className="w-full pl-9 pr-3 py-2 border rounded-md text-sm bg-background"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background"
                value={status}
                onChange={(e) => updateQueryParams({ status: e.target.value || null })}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background"
                value={channel}
                onChange={(e) => updateQueryParams({ channel: e.target.value || null })}
              >
                {CHANNEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="text-sm text-muted-foreground ml-auto">
                {total} lead{total !== 1 ? "s" : ""}
              </span>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : leads.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                {search || status || channel
                  ? "Nenhum lead encontrado para esses filtros"
                  : "Nenhum lead cadastrado ainda"}
              </div>
            ) : (
              <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col flex-1">
                <Table className="text-sm" wrapperClassName="flex-1 overflow-auto">
                  <TableHeader className="sticky top-0 bg-slate-50 z-20 shadow-sm dark:bg-slate-900 border-b">
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70 w-[200px]">CLINICA</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">CONTATO</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">TELEFONE</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">STATUS</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">CANAL</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">DOR</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70 text-right">MRR</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">FOLLOW-UP</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70 text-right w-[80px]">ACOES</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow
                        key={lead.id}
                        className="group cursor-pointer"
                        onClick={() => handleEdit(lead)}
                      >
                        <TableCell className="max-w-[200px]">
                          <div className="font-medium truncate" title={lead.clinic_name}>
                            {lead.clinic_name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{lead.city}</div>
                        </TableCell>
                        <TableCell className="truncate max-w-[140px]">{lead.contact_name}</TableCell>
                        <TableCell>{lead.phone || "-"}</TableCell>
                        <TableCell>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-700"}`}>
                            {STATUS_LABELS[lead.status] || lead.status}
                          </span>
                        </TableCell>
                        <TableCell className="capitalize">{lead.channel || "-"}</TableCell>
                        <TableCell className="capitalize">{lead.pain_score || "-"}</TableCell>
                        <TableCell className="text-right">{lead.mrr ? formatCurrency(lead.mrr) : "-"}</TableCell>
                        <TableCell>{formatDate(lead.next_follow_up_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleEdit(lead)} className="p-1.5 rounded hover:bg-muted" title="Editar">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteClick(lead.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Excluir">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="border-t p-4 shrink-0 bg-card">
                  <DataTablePagination meta={{ page, limit, total, total_pages: totalPages }} entityName="leads" />
                </div>
              </div>
            )}
          </div>
          )}

          {/* === TAB DASHBOARD === */}
          {activeTab === "dashboard" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {dashboardLoading || !dashboard ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex flex-col gap-6 flex-1 overflow-auto">
                {/* Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                  <MetricCard icon={DollarSign} label="MRR Total (Clinicas)" value={formatCurrency(dashboard.total_clinic_mrr)} color="text-emerald-500" bg="bg-emerald-500/10" />
                  <MetricCard icon={DollarSign} label="MRR Leads Convertidos" value={formatCurrency(dashboard.total_mrr)} color="text-blue-500" bg="bg-blue-500/10" />
                  <MetricCard icon={Target} label="Total de Leads" value={String(dashboard.total_leads)} color="text-purple-500" bg="bg-purple-500/10" />
                  <MetricCard icon={TrendingUp} label="Convertidos" value={String(dashboard.converted_leads)} color="text-green-500" bg="bg-green-500/10" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                  {/* Leads by Status */}
                  <div className="bg-card rounded-xl border border-border shadow-sm p-4">
                    <h3 className="text-sm font-semibold mb-3">Leads por Status</h3>
                    <div className="space-y-2">
                      {dashboard.leads_by_status.map((s) => (
                        <div key={s.status} className="flex items-center justify-between text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status as LeadStatus] || "bg-gray-100 text-gray-700"}`}>
                            {STATUS_LABELS[s.status as LeadStatus] || s.status}
                          </span>
                          <span className="font-medium">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Clinics per Plan */}
                  <div className="bg-card rounded-xl border border-border shadow-sm p-4">
                    <h3 className="text-sm font-semibold mb-3">Clinicas por Plano</h3>
                    <div className="space-y-2">
                      {dashboard.clinics_per_plan.map((p) => (
                        <div key={p.plan_name} className="flex items-center justify-between text-sm">
                          <span>{p.plan_name}</span>
                          <span className="font-medium">{p.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-card rounded-xl border border-border shadow-sm p-4">
                    <h3 className="text-sm font-semibold mb-3">Resumo</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Total clinicas</span><span className="font-medium">{dashboard.clinics.length}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Trials ativos</span><span className="font-medium">{dashboard.active_trials}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Taxa conversao</span><span className="font-medium">{dashboard.total_leads > 0 ? Math.round((dashboard.converted_leads / dashboard.total_leads) * 100) : 0}%</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">MRR medio/clinica</span><span className="font-medium">{dashboard.clinics.length > 0 ? formatCurrency(dashboard.total_clinic_mrr / dashboard.clinics.length) : "R$ 0"}</span></div>
                    </div>
                  </div>
                </div>

                {/* Clinics Table */}
                <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col flex-1 min-h-[300px]">
                  <Table className="text-sm" wrapperClassName="flex-1 overflow-auto">
                    <TableHeader className="sticky top-0 bg-slate-50 z-20 shadow-sm dark:bg-slate-900 border-b">
                      <TableRow>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70 w-[200px]">CLINICA</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">DONO</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">EMAIL</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">PLANO</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">STATUS</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70 text-right">MRR</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70">CRIADA EM</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.clinics.map((clinic) => (
                        <TableRow key={clinic.id}>
                          <TableCell className="max-w-[200px]">
                            <div className="font-medium truncate" title={clinic.name}>{clinic.name}</div>
                          </TableCell>
                          <TableCell className="truncate max-w-[140px]">{clinic.owner_name || "-"}</TableCell>
                          <TableCell className="truncate max-w-[180px]">{clinic.email}</TableCell>
                          <TableCell>{clinic.plan_name || "-"}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              clinic.subscription_status === "active" ? "bg-green-100 text-green-700" :
                              clinic.subscription_status === "trial" ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {clinic.subscription_status || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{clinic.mrr > 0 ? formatCurrency(clinic.mrr) : "-"}</TableCell>
                          <TableCell>{formatDate(clinic.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      <LeadSheet open={sheetOpen} onOpenChange={setSheetOpen} lead={editingLead} onSaved={handleSaved} />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir lead?"
        description="Esta acao nao pode ser desfeita."
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        background: active ? "#1a1a2e" : "transparent",
        color: active ? "white" : "#6b7280",
        border: "none",
        cursor: "pointer",
        transition: "all 200ms ease",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function MetricCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center ${color} shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground whitespace-nowrap">{label}</div>
      </div>
    </div>
  );
}
