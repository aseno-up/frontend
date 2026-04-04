"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ReactSelect, ReactCreatableSelect, type SelectOption } from "@/components/ui/react-select";
import { api } from "@/lib/api/client";
import { handleApiError } from "@/lib/toast";
import type { Lead } from "@/types/api";

interface LeadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onSaved: () => void;
}

const TYPE_OPTIONS: SelectOption[] = [
  { value: "estetica", label: "Estetica" },
  { value: "fisioterapia", label: "Fisioterapia" },
  { value: "misto", label: "Misto" },
  { value: "psicologia", label: "Psicologia" },
];

const CHANNEL_OPTIONS: SelectOption[] = [
  { value: "outbound", label: "Outbound" },
  { value: "inbound", label: "Inbound" },
];

const SOURCE_OPTIONS: SelectOption[] = [
  { value: "google_maps", label: "Google Maps" },
  { value: "instagram", label: "Instagram" },
  { value: "indicacao", label: "Indicacao" },
  { value: "anuncio", label: "Anuncio" },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: "identificado", label: "Identificado" },
  { value: "contactado", label: "Contactado" },
  { value: "respondeu", label: "Respondeu" },
  { value: "demo_agendada", label: "Demo Agendada" },
  { value: "trial_ativo", label: "Trial Ativo" },
  { value: "negociando", label: "Negociando" },
  { value: "convertido", label: "Convertido" },
  { value: "sem_resposta", label: "Sem Resposta" },
  { value: "descartado", label: "Descartado" },
  { value: "isca", label: "Isca" },
];

const PAIN_OPTIONS: SelectOption[] = [
  { value: "alto", label: "Alto" },
  { value: "medio", label: "Medio" },
  { value: "baixo", label: "Baixo" },
];

const CONTACT_CHANNEL_OPTIONS: SelectOption[] = [
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Instagram", label: "Instagram" },
  { value: "Telegram", label: "Telegram" },
  { value: "Facebook", label: "Facebook" },
  { value: "Email", label: "Email" },
  { value: "Telefone", label: "Telefone" },
];

interface PlanAPI {
  id: string;
  name: string;
}

interface AccountAPI {
  id: string;
  owner_name: string;
  clinic_name: string;
  subscription_status: string;
  plan_name: string;
  mrr: number;
}

interface FormState {
  clinic_name: string;
  contact_name: string;
  phone: string;
  city: string;
  type: string;
  channel: string;
  source: string;
  status: string;
  pain_score: string;
  first_contact_at: string;
  next_follow_up_at: string;
  trial_start_at: string;
  trial_end_at: string;
  interest_plan: string;
  contracted_plan: string;
  cancellation_reason: string;
  mrr: string;
  site: string;
  instagram: string;
  contact_channel: string;
  initial_message: string;
  notes: string;
  account_id: string;
}

const emptyForm: FormState = {
  clinic_name: "",
  contact_name: "",
  phone: "",
  city: "",
  type: "",
  channel: "",
  source: "",
  status: "identificado",
  pain_score: "",
  first_contact_at: "",
  next_follow_up_at: "",
  trial_start_at: "",
  trial_end_at: "",
  interest_plan: "",
  contracted_plan: "",
  cancellation_reason: "",
  mrr: "",
  site: "",
  instagram: "",
  contact_channel: "",
  initial_message: "",
  notes: "",
  account_id: "",
};

function toDateInput(date?: string): string {
  if (!date) return "";
  return date.slice(0, 10);
}

function toISOOrNull(date: string): string | null {
  if (!date) return null;
  return new Date(date + "T00:00:00Z").toISOString();
}

function findOption(options: SelectOption[], value: string): SelectOption | null {
  return options.find((o) => o.value === value) || null;
}

export function LeadSheet({ open, onOpenChange, lead, onSaved }: LeadSheetProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [planOptions, setPlanOptions] = useState<SelectOption[]>([]);
  const [accounts, setAccounts] = useState<AccountAPI[]>([]);
  const [cityOptions, setCityOptions] = useState<SelectOption[]>([]);

  const accountOptions: SelectOption[] = useMemo(
    () =>
      accounts.map((a) => ({
        value: a.id,
        label: [a.owner_name, a.clinic_name, a.plan_name]
          .filter(Boolean)
          .join(" — ") + ` (${a.subscription_status})`,
      })),
    [accounts]
  );

  useEffect(() => {
    if (open) {
      api.getPlans().then((res: PlanAPI[] | { data?: PlanAPI[] }) => {
        const list = Array.isArray(res) ? res : (res.data || []);
        setPlanOptions(list.map((p) => ({ value: p.name, label: p.name })));
      }).catch(() => {});
      api.getAdminAccounts().then((res: { data?: AccountAPI[] }) => {
        setAccounts(res.data || []);
      }).catch(() => {});
      api.getLeads({ limit: 200 }).then((res: { data?: Lead[] }) => {
        const list = res.data || [];
        const cities = [...new Set(list.map((l: Lead) => l.city).filter(Boolean))].sort();
        setCityOptions(cities.map((c: string) => ({ value: c, label: c })));
      }).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (lead) {
      setForm({
        clinic_name: lead.clinic_name || "",
        contact_name: lead.contact_name || "",
        phone: lead.phone || "",
        city: lead.city || "",
        type: lead.type || "",
        channel: lead.channel || "",
        source: lead.source || "",
        status: lead.status || "identificado",
        pain_score: lead.pain_score || "",
        first_contact_at: toDateInput(lead.first_contact_at),
        next_follow_up_at: toDateInput(lead.next_follow_up_at),
        trial_start_at: toDateInput(lead.trial_start_at),
        trial_end_at: toDateInput(lead.trial_end_at),
        interest_plan: lead.interest_plan || "",
        contracted_plan: lead.contracted_plan || "",
        cancellation_reason: lead.cancellation_reason || "",
        mrr: lead.mrr ? String(lead.mrr) : "",
        site: lead.site || "",
        instagram: lead.instagram || "",
        contact_channel: lead.contact_channel || "",
        initial_message: lead.initial_message || "",
        notes: lead.notes || "",
        account_id: lead.account_id || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [lead, open]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAccountChange = (accountId: string) => {
    handleChange("account_id", accountId);

    if (accountId) {
      const account = accounts.find((a) => a.id === accountId);
      if (account) {
        setForm((prev) => ({
          ...prev,
          account_id: accountId,
          contracted_plan: account.plan_name || prev.contracted_plan,
          mrr: account.mrr ? String(Math.round(account.mrr * 100) / 100) : prev.mrr,
          status: "convertido",
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload: Record<string, unknown> = {
        clinic_name: form.clinic_name,
        contact_name: form.contact_name,
        phone: form.phone,
        city: form.city,
        type: form.type || undefined,
        channel: form.channel || undefined,
        source: form.source || undefined,
        status: form.status || undefined,
        pain_score: form.pain_score || undefined,
        first_contact_at: toISOOrNull(form.first_contact_at),
        next_follow_up_at: toISOOrNull(form.next_follow_up_at),
        trial_start_at: toISOOrNull(form.trial_start_at),
        trial_end_at: toISOOrNull(form.trial_end_at),
        interest_plan: form.interest_plan,
        contracted_plan: form.contracted_plan,
        cancellation_reason: form.cancellation_reason,
        mrr: form.mrr ? parseFloat(form.mrr) : 0,
        site: form.site,
        instagram: form.instagram,
        contact_channel: form.contact_channel || undefined,
        initial_message: form.initial_message,
        notes: form.notes,
        account_id: form.account_id || undefined,
      };

      if (lead) {
        await api.updateLead(lead.id, payload);
      } else {
        await api.createLead(payload);
      }
      onSaved();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* Contato */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Contato
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome da Clinica <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.clinic_name}
                  onChange={(e) => handleChange("clinic_name", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome do Contato <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.contact_name}
                  onChange={(e) => handleChange("contact_name", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cidade</label>
                <ReactCreatableSelect
                  isClearable
                  placeholder="Selecionar ou digitar..."
                  options={cityOptions}
                  value={form.city ? { value: form.city, label: form.city } : null}
                  onChange={(opt) => handleChange("city", opt?.value || "")}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Site</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="https://..."
                  value={form.site}
                  onChange={(e) => handleChange("site", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Instagram</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="@perfil"
                  value={form.instagram}
                  onChange={(e) => handleChange("instagram", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Canal de Contato</label>
                <ReactSelect
                  isClearable
                  placeholder="Selecionar..."
                  options={CONTACT_CHANNEL_OPTIONS}
                  value={findOption(CONTACT_CHANNEL_OPTIONS, form.contact_channel)}
                  onChange={(opt) => handleChange("contact_channel", opt?.value || "")}
                />
              </div>
            </div>
          </fieldset>

          {/* Classificacao */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Classificacao
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <ReactSelect
                  isClearable
                  placeholder="Selecionar..."
                  options={TYPE_OPTIONS}
                  value={findOption(TYPE_OPTIONS, form.type)}
                  onChange={(opt) => handleChange("type", opt?.value || "")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Canal</label>
                <ReactSelect
                  isClearable
                  placeholder="Selecionar..."
                  options={CHANNEL_OPTIONS}
                  value={findOption(CHANNEL_OPTIONS, form.channel)}
                  onChange={(opt) => handleChange("channel", opt?.value || "")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Fonte</label>
                <ReactSelect
                  isClearable
                  placeholder="Selecionar..."
                  options={SOURCE_OPTIONS}
                  value={findOption(SOURCE_OPTIONS, form.source)}
                  onChange={(opt) => handleChange("source", opt?.value || "")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dor</label>
                <ReactSelect
                  isClearable
                  placeholder="Selecionar..."
                  options={PAIN_OPTIONS}
                  value={findOption(PAIN_OPTIONS, form.pain_score)}
                  onChange={(opt) => handleChange("pain_score", opt?.value || "")}
                />
              </div>
            </div>
          </fieldset>

          {/* Status & Datas */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Status e Datas
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <ReactSelect
                  placeholder="Selecionar..."
                  options={STATUS_OPTIONS}
                  value={findOption(STATUS_OPTIONS, form.status)}
                  onChange={(opt) => handleChange("status", opt?.value || "identificado")}
                />
              </div>
              <DateField
                label="Primeiro Contato"
                value={form.first_contact_at}
                onChange={(v) => handleChange("first_contact_at", v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DateField
                label="Proximo Follow-up"
                value={form.next_follow_up_at}
                onChange={(v) => handleChange("next_follow_up_at", v)}
              />
              <DateField
                label="Inicio Trial"
                value={form.trial_start_at}
                onChange={(v) => handleChange("trial_start_at", v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DateField
                label="Fim Trial"
                value={form.trial_end_at}
                onChange={(v) => handleChange("trial_end_at", v)}
              />
            </div>
          </fieldset>

          {/* Comercial */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Comercial
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Plano de Interesse</label>
                <ReactSelect
                  isClearable
                  placeholder="Selecionar..."
                  options={planOptions}
                  value={findOption(planOptions, form.interest_plan)}
                  onChange={(opt) => handleChange("interest_plan", opt?.value || "")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Plano Contratado</label>
                <ReactSelect
                  isClearable
                  placeholder="Selecionar..."
                  options={planOptions}
                  value={findOption(planOptions, form.contracted_plan)}
                  onChange={(opt) => handleChange("contracted_plan", opt?.value || "")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">MRR (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.mrr}
                  onChange={(e) => handleChange("mrr", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Motivo Cancelamento</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.cancellation_reason}
                  onChange={(e) => handleChange("cancellation_reason", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vincular a Account</label>
              <ReactSelect
                isClearable
                placeholder="Buscar por nome do owner, clinica ou plano..."
                options={accountOptions}
                value={findOption(accountOptions, form.account_id)}
                onChange={(opt) => handleAccountChange(opt?.value || "")}
              />
              {form.account_id && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ao salvar, o status sera marcado como &quot;convertido&quot; e o plano/MRR serao preenchidos automaticamente.
                </p>
              )}
            </div>
          </fieldset>

          {/* Mensagem Inicial */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Mensagem Inicial
            </legend>
            <p className="text-xs text-muted-foreground">
              Mensagem gerada para envio futuro. Nao sera enviada automaticamente.
            </p>
            <textarea
              rows={6}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-y"
              value={form.initial_message}
              onChange={(e) => handleChange("initial_message", e.target.value)}
              placeholder="Cole ou escreva a mensagem inicial aqui..."
            />
          </fieldset>

          {/* Notas */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Notas
            </legend>
            <textarea
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-y"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Observacoes gerais..."
            />
          </fieldset>

          <DialogFooter className="gap-2 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm border rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !form.clinic_name || !form.contact_name}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {lead ? "Salvar" : "Criar"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type="date"
        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
