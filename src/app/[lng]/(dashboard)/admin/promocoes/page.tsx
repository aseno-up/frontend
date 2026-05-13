"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Pencil,
  Tag,
} from "lucide-react";

import { Header } from "@/components/dashboard/header";
import { api } from "@/lib/api/client";
import { handleApiError, showToast } from "@/lib/toast";
import { FALLBACK_CONFIG, type PublicConfig } from "@/lib/meta-pixel";

interface Promotion {
  id: string;
  name: string;
  description: string;
  discount_percent: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  plans_affected: string[];
  banner_label: string;
  banner_show_timer: boolean;
  created_at: string;
  updated_at: string;
}

interface FormState {
  name: string;
  description: string;
  discount_percent: number | "";
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  plans_affected: string[];
  banner_label: string;
  banner_show_timer: boolean;
}

const AVAILABLE_PLANS = [
  { slug: "basic", label: "Basic" },
  { slug: "professional", label: "Professional" },
  { slug: "advanced", label: "Advanced" },
];

// Menor preço de entrada (mensal) entre os planos selecionados, já com o desconto.
// Considera a variante solo quando existir (é mais barata); senão usa price_monthly.
function lowestDiscountedPrice(
  config: PublicConfig,
  plans: string[],
  discountPercent: number,
): number | null {
  if (plans.length === 0 || !discountPercent) return null
  const slugs = plans.includes("all") ? ["basic", "professional", "advanced"] : plans
  let min: number | null = null
  for (const slug of slugs) {
    const p = config.plans[slug]
    if (!p) continue
    const base = p.solo_price_monthly > 0 ? p.solo_price_monthly : p.price_monthly
    if (base <= 0) continue
    const discounted = Math.max(1, Math.round((base * (100 - discountPercent)) / 100))
    if (min === null || discounted < min) min = discounted
  }
  return min
}

function formatBRDate(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function buildBannerLabel(
  price: number | null,
  percent: number | string,
  expiresIso: string,
): string {
  const dateStr = formatBRDate(expiresIso)
  if (price !== null && dateStr) return `Promoção: a partir de R$ ${price}/mês até ${dateStr}`
  if (price !== null) return `Promoção: a partir de R$ ${price}/mês por tempo limitado`
  if (percent && dateStr) return `Promoção: ${percent}% off até ${dateStr}`
  if (percent) return `Promoção: ${percent}% off por tempo limitado`
  return ""
}

function buildDescription(
  percent: number | string,
  plans: string[],
  expiresIso: string,
): string {
  if (!percent || plans.length === 0) return ""
  const planLabels = plans.includes("all")
    ? "todos os planos"
    : plans.length === 1
      ? `o plano ${plans[0].charAt(0).toUpperCase()}${plans[0].slice(1)}`
      : `os planos ${plans.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(", ")}`
  const dateStr = formatBRDate(expiresIso)
  const ending = dateStr ? ` Válida até ${dateStr}.` : ""
  return `${percent}% de desconto em ${planLabels} para novas assinaturas.${ending} Aplica nos ciclos mensal e anual.`
}

const emptyForm: FormState = {
  name: "",
  description: "",
  discount_percent: "",
  starts_at: "",
  expires_at: "",
  is_active: false,
  plans_affected: [],
  banner_label: "",
  banner_show_timer: true,
};

function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
}

interface PageProps {
  params: Promise<{ lng: string }>;
}

export default function PromocoesPage({ params }: PageProps) {
  const [lng, setLng] = useState("pt-BR");
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PublicConfig>(FALLBACK_CONFIG);
  // Quando o usuário digita manualmente em banner_label/description, paramos de
  // sobrescrever com os defaults — respeito da escolha dele.
  const [bannerEdited, setBannerEdited] = useState(false);
  const [descEdited, setDescEdited] = useState(false);

  useEffect(() => {
    params.then((p) => setLng(p.lng));
  }, [params]);

  // Busca a config pública só pra ter preços reais nos defaults do banner.
  // Sem auth — esse mesmo endpoint serve a landing.
  useEffect(() => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4901").replace(
      /\/api\/v1\/?$/,
      "",
    );
    fetch(`${baseUrl}/api/v1/public/config`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PublicConfig | null) => {
        if (data) setConfig(data);
      })
      .catch(() => {});
  }, []);

  // Auto-preenche banner_label e description conforme % / planos / data mudam,
  // contanto que o usuário ainda não tenha tocado manualmente nesses campos.
  useEffect(() => {
    if (!isModalOpen) return;
    const percent = form.discount_percent === "" ? "" : Number(form.discount_percent);
    if (!percent || form.plans_affected.length === 0) return;
    const minPrice = lowestDiscountedPrice(config, form.plans_affected, percent);
    setForm((f) => ({
      ...f,
      banner_label: bannerEdited
        ? f.banner_label
        : buildBannerLabel(minPrice, percent, f.expires_at),
      description: descEdited
        ? f.description
        : buildDescription(percent, f.plans_affected, f.expires_at),
    }));
    // Intencionalmente sem `form` nas deps — só queremos reagir aos campos-chave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.discount_percent,
    form.plans_affected,
    form.expires_at,
    config,
    isModalOpen,
    bannerEdited,
    descEdited,
  ]);

  const fetchPromotions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.listPromotions();
      setPromotions(response.data || []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    // Defaults zerados → o useEffect vai preencher assim que % e planos forem informados.
    setBannerEdited(false);
    setDescEdited(false);
    setIsModalOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description,
      discount_percent: p.discount_percent,
      starts_at: toDatetimeLocal(p.starts_at),
      expires_at: toDatetimeLocal(p.expires_at),
      is_active: p.is_active,
      plans_affected: p.plans_affected || [],
      banner_label: p.banner_label,
      banner_show_timer: p.banner_show_timer,
    });
    // Em edição, presume-se que o usuário já personalizou — não sobrescrever.
    setBannerEdited(true);
    setDescEdited(true);
    setIsModalOpen(true);
  };

  const togglePlan = (slug: string) => {
    setForm((f) => ({
      ...f,
      plans_affected: f.plans_affected.includes(slug)
        ? f.plans_affected.filter((s) => s !== slug)
        : [...f.plans_affected, slug],
    }));
  };

  const validateAndSubmit = async () => {
    if (!form.name.trim()) {
      showToast.error("Nome é obrigatório");
      return;
    }
    if (!form.banner_label.trim()) {
      showToast.error("Texto do banner é obrigatório");
      return;
    }
    if (form.discount_percent === "" || form.discount_percent < 1 || form.discount_percent > 90) {
      showToast.error("Desconto deve estar entre 1 e 90%");
      return;
    }
    if (!form.starts_at || !form.expires_at) {
      showToast.error("Datas de início e expiração são obrigatórias");
      return;
    }
    const starts = new Date(form.starts_at);
    const expires = new Date(form.expires_at);
    if (!(starts < expires)) {
      showToast.error("Data de início deve ser anterior à expiração");
      return;
    }
    if (form.plans_affected.length === 0) {
      showToast.error("Selecione pelo menos 1 plano afetado");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        discount_percent: Number(form.discount_percent),
        starts_at: starts.toISOString(),
        expires_at: expires.toISOString(),
        is_active: form.is_active,
        plans_affected: form.plans_affected,
        banner_label: form.banner_label.trim(),
        banner_show_timer: form.banner_show_timer,
      };
      if (editingId) {
        await api.updatePromotion(editingId, payload);
        showToast.success("Promoção atualizada");
      } else {
        await api.createPromotion(payload);
        showToast.success("Promoção criada");
      }
      await fetch("/api/revalidate-promotion", { method: "POST" }).catch(() => {});
      setIsModalOpen(false);
      fetchPromotions();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (p: Promotion) => {
    try {
      await api.updatePromotion(p.id, { is_active: !p.is_active });
      await fetch("/api/revalidate-promotion", { method: "POST" }).catch(() => {});
      fetchPromotions();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta promoção? Esta ação não pode ser desfeita.")) return;
    try {
      await api.deletePromotion(id);
      await fetch("/api/revalidate-promotion", { method: "POST" }).catch(() => {});
      setPromotions((prev) => prev.filter((p) => p.id !== id));
      showToast.success("Promoção removida");
    } catch (error) {
      handleApiError(error);
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleString("pt-BR");

  return (
    <div className="flex flex-col h-full">
      <Header lng={lng} title="Promoções" />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Promoções aparecem no banner do topo da landing page e aplicam desconto aos planos selecionados. Apenas 1 ativa por vez.
          </p>
          <button
            onClick={openCreate}
            className="bg-primary text-white px-4 py-2 rounded-md text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Nova Promoção
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Nenhuma promoção cadastrada
          </div>
        ) : (
          <div className="space-y-3">
            {promotions.map((p) => {
              const now = new Date();
              const isInWindow =
                now >= new Date(p.starts_at) && now < new Date(p.expires_at);
              const isLive = p.is_active && isInWindow;
              return (
                <div
                  key={p.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-sm font-medium text-emerald-600">
                          -{p.discount_percent}%
                        </span>
                        {isLive && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            No ar agora
                          </span>
                        )}
                        {p.is_active && !isInWindow && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            Ativa, fora da janela
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <p className="text-sm text-gray-500 mt-1">{p.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(p.starts_at)} → {formatDate(p.expires_at)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Planos: {(p.plans_affected || []).join(", ") || "—"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Banner: &ldquo;{p.banner_label}&rdquo;{" "}
                        {p.banner_show_timer ? "(com countdown)" : "(sem countdown)"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className="p-1"
                        title={p.is_active ? "Desativar" : "Ativar"}
                      >
                        {p.is_active ? (
                          <ToggleRight className="w-8 h-8 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-gray-300" />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1 text-gray-400 hover:text-gray-700"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h3 className="font-semibold">
                {editingId ? "Editar Promoção" : "Nova Promoção"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome interno
                </label>
                <input
                  type="text"
                  placeholder="ex: Promoção de Maio 2026"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (aparece no modal de info)
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    Auto-gerado · edite se quiser
                  </span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Explique como funciona a promoção, condições e termos..."
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => {
                    setDescEdited(true);
                    setForm({ ...form, description: e.target.value });
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desconto (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    placeholder="ex: 25"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={form.discount_percent}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discount_percent:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto curto do banner
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      Auto-gerado · edite se quiser
                    </span>
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="ex: Promoção: a partir de R$ 44/mês até 31/05"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={form.banner_label}
                    onChange={(e) => {
                      setBannerEdited(true);
                      setForm({ ...form, banner_label: e.target.value });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Início
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={form.starts_at}
                    onChange={(e) =>
                      setForm({ ...form, starts_at: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expira em
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={form.expires_at}
                    onChange={(e) =>
                      setForm({ ...form, expires_at: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planos afetados
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_PLANS.map((plan) => {
                    const checked = form.plans_affected.includes(plan.slug);
                    return (
                      <button
                        key={plan.slug}
                        type="button"
                        onClick={() => togglePlan(plan.slug)}
                        className={
                          "px-3 py-1.5 rounded-full text-sm border transition " +
                          (checked
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-500")
                        }
                      >
                        {plan.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show_timer"
                  checked={form.banner_show_timer}
                  onChange={(e) =>
                    setForm({ ...form, banner_show_timer: e.target.checked })
                  }
                />
                <label htmlFor="show_timer" className="text-sm">
                  Mostrar countdown até a expiração
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                />
                <label htmlFor="is_active" className="text-sm">
                  Ativar imediatamente (desativa as outras)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm border rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={validateAndSubmit}
                disabled={saving}
                className="px-4 py-2 text-sm bg-primary text-white rounded-md disabled:opacity-50"
              >
                {saving ? "Salvando..." : editingId ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
