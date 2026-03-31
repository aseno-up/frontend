"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  DollarSign,
  Activity,
  Clock,
  Loader2,
  AlertTriangle,
  Minus,
  Plus,
  Info,
  Zap,
  Check,
  Settings,
  CreditCard,
  Tag,
  Pencil,
  Trash2,
  Link2,
} from "lucide-react";

import { Header } from "@/components/dashboard/header";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api/client";
import { handleApiError } from "@/lib/toast";
import { PlanFormModal } from "./plan-form-modal";
import { OfferFormModal } from "./offer-form-modal";
import type { Plan, Offer } from "@/types/api";

interface AdminSettingsPageProps {
  params: Promise<{ lng: string }>;
}

interface SettingDetail {
  value: string;
  description: string;
}

export default function AdminSettingsPage({ params }: AdminSettingsPageProps) {
  const [lng, setLng] = useState("pt-BR");
  const { clinic } = useAuthStore();
  const [settings, setSettings] = useState<Record<string, SettingDetail>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });
  const [activeTab, setActiveTab] = useState<"general" | "plans" | "offers">(
    "general",
  );

  const [plans, setPlans] = useState<Plan[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [copiedOfferId, setCopiedOfferId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ lng }) => setLng(lng));
  }, [params]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdminSettings();
      setSettings(data.settings);
      const values: Record<string, string> = {};
      Object.entries(data.settings).forEach(([key, detail]) => {
        values[key] = detail.value;
      });
      setEditedValues(values);

      // Fetch plans and offers
      fetchPlansAndOffers();
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlansAndOffers = async () => {
    try {
      const plansData = await api.getPlans();
      setPlans(plansData);
      const offersData = await api.getOffers();
      setOffers(offersData || []);
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleSavePlan = async (data: any) => {
    try {
      if (selectedPlan) {
        await api.updatePlan(selectedPlan.id, data);
        showToast("Plano atualizado com sucesso!");
      } else {
        await api.createPlan(data);
        showToast("Plano criado com sucesso!");
      }
      fetchPlansAndOffers();
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleSaveOffer = async (data: any) => {
    try {
      if (selectedOffer) {
        await api.updateOffer(selectedOffer.id, data);
        showToast("Oferta atualizada com sucesso!");
      } else {
        await api.createOffer(data);
        showToast("Oferta criada com sucesso!");
      }
      fetchPlansAndOffers();
    } catch (err) {
      handleApiError(err);
    }
  };

  const updateValue = useCallback((key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const stepValue = useCallback((key: string, delta: number) => {
    setEditedValues((prev) => {
      const current = parseInt(prev[key] || "0");
      const minVal = key === "plan_advanced_limit" ? -1 : 0;
      const newVal = Math.max(minVal, current + delta);
      return { ...prev, [key]: String(newVal) };
    });
    setDirty(true);
  }, []);

  const handleToggle = useCallback((key: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [key]: prev[key] === "true" ? "false" : "true",
    }));
    setDirty(true);
  }, []);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  const saveAll = async () => {
    const changedKeys = Object.keys(editedValues).filter(
      (key) => editedValues[key] !== settings[key]?.value,
    );
    if (changedKeys.length === 0) return;

    try {
      setIsSaving(true);
      for (const key of changedKeys) {
        await api.updateAdminSetting(key, editedValues[key]);
      }
      // Update local settings state
      const newSettings = { ...settings };
      changedKeys.forEach((key) => {
        newSettings[key] = { ...newSettings[key], value: editedValues[key] };
      });
      setSettings(newSettings);
      setDirty(false);
      showToast("Configurações salvas com sucesso!");
    } catch (err) {
      handleApiError(err);
      // Revert changed values
      const reverted = { ...editedValues };
      changedKeys.forEach((key) => {
        reverted[key] = settings[key]?.value || "";
      });
      setEditedValues(reverted);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    const values: Record<string, string> = {};
    Object.entries(settings).forEach(([key, detail]) => {
      values[key] = detail.value;
    });
    setEditedValues(values);
    setDirty(false);
  };

  // Computed values
  const limBasico = editedValues.plan_basic_limit || "5";
  const limProfissional = editedValues.plan_pro_limit || "15";
  const limAvancado = editedValues.plan_advanced_limit || "-1";
  const isUnlimited = parseInt(limAvancado) === -1;
  const trialDias = parseInt(editedValues.trial_days || "14");
  const excessEnabled = editedValues.excess_billing_enabled === "true";

  const getTrialLabel = () => {
    if (trialDias === 0)
      return { text: "Sem trial", color: "#dc2626", bg: "#fef2f2" };
    if (trialDias <= 7)
      return { text: `${trialDias} dias`, color: "#d97706", bg: "#fffbeb" };
    if (trialDias === 14)
      return { text: "2 semanas", color: "#1a1a2e", bg: "#f0f1f5" };
    if (trialDias === 30)
      return { text: "1 mês", color: "#059669", bg: "#ecfdf5" };
    return { text: `${trialDias} dias`, color: "#1a1a2e", bg: "#f0f1f5" };
  };
  const trialLabel = getTrialLabel();

  // Access check
  if (clinic?.type !== "dev") {
    return (
      <div className="flex h-full flex-col">
        <Header lng={lng} title="Configurações do Sistema" />
        <div className="flex-1 flex items-center justify-center p-4">
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: "32px 40px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              maxWidth: 420,
              textAlign: "center",
              border: "1px solid #e8eaed",
            }}
          >
            <AlertTriangle
              style={{
                width: 40,
                height: 40,
                color: "#dc2626",
                margin: "0 auto 16px",
              }}
            />
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Acesso Restrito
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280" }}>
              Esta página está disponível apenas para clínicas de
              desenvolvimento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="Configurações do Sistema" />

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "40px 24px",
          background: "#f5f6f8",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {/* Page header */}
          <div style={{ marginBottom: 36 }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#0f1117",
                letterSpacing: -0.4,
                marginBottom: 4,
              }}
            >
              Configurações do Sistema
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280" }}>
              Gerencie planos, limites e cobranças da plataforma
            </p>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 28,
              borderBottom: "1px solid #e8eaed",
              paddingBottom: 16,
            }}
          >
            <TabButton
              active={activeTab === "general"}
              onClick={() => setActiveTab("general")}
              icon={<Settings style={{ width: 16, height: 16 }} />}
            >
              Geral
            </TabButton>
            <TabButton
              active={activeTab === "plans"}
              onClick={() => setActiveTab("plans")}
              icon={<CreditCard style={{ width: 16, height: 16 }} />}
            >
              Planos
            </TabButton>
            <TabButton
              active={activeTab === "offers"}
              onClick={() => setActiveTab("offers")}
              icon={<Tag style={{ width: 16, height: 16 }} />}
            >
              Ofertas / Cupons
            </TabButton>
          </div>

          {/* Save bar */}
          <div
            style={{
              position: "sticky",
              top: 16,
              zIndex: 100,
              background: "#1a1a2e",
              color: "white",
              borderRadius: 12,
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 28,
              boxShadow: "0 8px 24px rgba(26,26,46,0.3)",
              transform: dirty ? "translateY(0)" : "translateY(-4px)",
              opacity: dirty ? 1 : 0,
              pointerEvents: dirty ? "all" : "none",
              transition: "all 220ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>
              Você tem alterações não salvas
            </span>
            <button
              onClick={saveAll}
              disabled={isSaving}
              style={{
                background: "white",
                color: "#1a1a2e",
                border: "none",
                borderRadius: 8,
                padding: "7px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                opacity: isSaving ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
              }}
            >
              {isSaving ? (
                <Loader2
                  style={{
                    width: 14,
                    height: 14,
                    animation: "spin 1s linear infinite",
                  }}
                />
              ) : null}
              Salvar alterações
            </button>
          </div>

          {isLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "48px 0",
              }}
            >
              <Loader2
                style={{
                  width: 32,
                  height: 32,
                  color: "#9ca3af",
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
          ) : activeTab === "general" ? (
            <>
              {/* ── LIMITES DE PROFISSIONAIS ── */}
              <SectionCard
                icon={
                  <Users style={{ width: 18, height: 18, color: "#1a1a2e" }} />
                }
                title="Limites de Profissionais"
                subtitle="Número máximo de profissionais por plano"
                delay={0}
              >
                <div style={{ padding: "8px 28px 24px" }}>
                  <FieldRow
                    label="Plano Básico"
                    description="Limite de profissionais cadastrados"
                  >
                    <Stepper
                      value={limBasico}
                      onStep={(d) => stepValue("plan_basic_limit", d)}
                      onChange={(v) => updateValue("plan_basic_limit", v)}
                      min={1}
                    />
                  </FieldRow>

                  <FieldRow
                    label="Plano Profissional"
                    description="Limite de profissionais cadastrados"
                  >
                    <Stepper
                      value={limProfissional}
                      onStep={(d) => stepValue("plan_pro_limit", d)}
                      onChange={(v) => updateValue("plan_pro_limit", v)}
                      min={1}
                    />
                  </FieldRow>

                  <FieldRow
                    label="Plano Avançado"
                    description={
                      <span>
                        Use{" "}
                        <code
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 12,
                            background: "#f9fafb",
                            padding: "1px 5px",
                            borderRadius: 4,
                            border: "1px solid #e8eaed",
                          }}
                        >
                          -1
                        </code>{" "}
                        para ilimitado
                      </span>
                    }
                    isLast
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Stepper
                        value={limAvancado}
                        onStep={(d) => stepValue("plan_advanced_limit", d)}
                        onChange={(v) => updateValue("plan_advanced_limit", v)}
                        min={-1}
                      />
                      {isUnlimited && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "2px 8px",
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 600,
                            background: "#ecfdf5",
                            color: "#059669",
                            letterSpacing: 0.2,
                          }}
                        >
                          ✦ Ilimitado
                        </span>
                      )}
                    </div>
                  </FieldRow>
                </div>
              </SectionCard>

              {/* ── PREÇOS DOS PLANOS ── */}
              <SectionCard
                icon={
                  <DollarSign
                    style={{ width: 18, height: 18, color: "#1a1a2e" }}
                  />
                }
                title={
                  <>
                    Preços dos Planos{" "}
                    <span
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                        fontWeight: 500,
                      }}
                    >
                      (BRL)
                    </span>
                  </>
                }
                subtitle="Configure os preços mensais de cada plano"
                delay={60}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 12,
                    padding: "20px 28px 24px",
                  }}
                >
                  <PlanCard
                    label="Básico"
                    value={editedValues.plan_basic_price || "99"}
                    onChange={(v) => updateValue("plan_basic_price", v)}
                    limitText={`até ${limBasico} profissionais`}
                  />
                  <PlanCard
                    label="Profissional"
                    value={editedValues.plan_pro_price || "199"}
                    onChange={(v) => updateValue("plan_pro_price", v)}
                    limitText={`até ${limProfissional} profissionais`}
                  />
                  <PlanCard
                    label="Avançado"
                    value={editedValues.plan_advanced_price || "349"}
                    onChange={(v) => updateValue("plan_advanced_price", v)}
                    limitText={
                      isUnlimited
                        ? "Ilimitado"
                        : `até ${limAvancado} profissionais`
                    }
                  />
                </div>
              </SectionCard>

              {/* ── COBRANÇA DE EXCEDENTE ── */}
              <SectionCard
                icon={
                  <Activity
                    style={{ width: 18, height: 18, color: "#1a1a2e" }}
                  />
                }
                title="Cobrança de Excedente"
                subtitle="Configure a cobrança por profissional adicional"
                delay={120}
              >
                <div style={{ padding: "8px 28px 24px" }}>
                  {/* Toggle row */}
                  <div
                    style={{
                      padding: "20px 0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 24,
                      borderBottom: "1px solid #e8eaed",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#0f1117",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            display: "inline-block",
                            background: excessEnabled ? "#059669" : "#9ca3af",
                            boxShadow: excessEnabled
                              ? "0 0 0 3px #ecfdf5"
                              : "none",
                            verticalAlign: "middle",
                            marginRight: 4,
                          }}
                        />
                        Cobrança de Excedente Ativa
                      </div>
                      <div style={{ fontSize: 12.5, color: "#6b7280" }}>
                        Cobrar automaticamente por profissionais acima do limite
                        do plano
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={excessEnabled}
                      onChange={() => handleToggle("excess_billing_enabled")}
                    />
                  </div>

                  {/* Price field */}
                  <div
                    style={{
                      padding: "20px 0",
                      display: "grid",
                      gridTemplateColumns: "1fr 180px",
                      alignItems: "center",
                      gap: 24,
                      opacity: excessEnabled ? 1 : 0.4,
                      pointerEvents: excessEnabled ? "all" : "none",
                      transition: "opacity 200ms",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#0f1117",
                          marginBottom: 2,
                        }}
                      >
                        Preço por Profissional Excedente
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "#6b7280",
                          lineHeight: 1.4,
                        }}
                      >
                        Valor cobrado mensalmente por profissional além do
                        limite
                      </div>
                    </div>
                    <CurrencyInput
                      value={editedValues.plan_excess_price || "20"}
                      onChange={(v) => updateValue("plan_excess_price", v)}
                    />
                  </div>

                  {/* Hint */}
                  {excessEnabled && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        color: "#9ca3af",
                        marginTop: 10,
                        padding: "8px 12px",
                        background: "#f9fafb",
                        borderRadius: 8,
                        border: "1px dashed #e8eaed",
                      }}
                    >
                      <Zap style={{ width: 12, height: 12, flexShrink: 0 }} />
                      Cobrança excedente ativa — cada profissional além do
                      limite será cobrado automaticamente
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* ── PERÍODO DE TRIAL ── */}
              <SectionCard
                icon={
                  <Clock style={{ width: 18, height: 18, color: "#1a1a2e" }} />
                }
                title="Período de Trial"
                subtitle="Configure o período de teste gratuito para novos clientes"
                delay={180}
              >
                <div style={{ padding: "8px 28px 24px" }}>
                  <div
                    style={{
                      padding: "20px 0",
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      alignItems: "center",
                      gap: 24,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#0f1117",
                          marginBottom: 2,
                        }}
                      >
                        Dias de Trial Gratuito
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "#6b7280",
                          lineHeight: 1.4,
                        }}
                      >
                        Período de acesso completo sem cobrança após o cadastro
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Stepper
                        value={String(trialDias)}
                        onStep={(d) => stepValue("trial_days", d)}
                        onChange={(v) => updateValue("trial_days", v)}
                        min={0}
                      />
                      <span
                        style={{
                          fontSize: 13,
                          color: "#6b7280",
                          fontWeight: 500,
                        }}
                      >
                        dias
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          padding: "2px 8px",
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: 0.2,
                          background: trialLabel.bg,
                          color: trialLabel.color,
                        }}
                      >
                        {trialLabel.text}
                      </span>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Bottom actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  paddingTop: 8,
                }}
              >
                <button
                  onClick={resetForm}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    background: "transparent",
                    color: "#6b7280",
                    border: "1.5px solid #e8eaed",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 180ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f9fafb";
                    e.currentTarget.style.borderColor = "#c5c9d3";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "#e8eaed";
                  }}
                >
                  Descartar
                </button>
                <button
                  onClick={saveAll}
                  disabled={isSaving}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    background: "#1a1a2e",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    boxShadow: "0 2px 8px rgba(26,26,46,0.25)",
                    transition: "all 180ms ease",
                    opacity: isSaving ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 14px rgba(26,26,46,0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(26,26,46,0.25)";
                  }}
                >
                  {isSaving ? (
                    <Loader2
                      style={{
                        width: 14,
                        height: 14,
                        animation: "spin 1s linear infinite",
                      }}
                    />
                  ) : null}
                  Salvar configurações
                </button>
              </div>
            </>
          ) : activeTab === "plans" ? (
            <div style={{ paddingTop: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <div>
                  <h2
                    style={{ fontSize: 18, fontWeight: 700, color: "#0f1117" }}
                  >
                    Planos Disponíveis
                  </h2>
                  <p style={{ fontSize: 13, color: "#6b7280" }}>
                    Gerencie os planos base do sistema
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    setIsPlanModalOpen(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    background: "#1a1a2e",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Plus style={{ width: 14, height: 14 }} /> Novo Plano
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 16,
                }}
              >
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    style={{
                      background: "white",
                      border: "1px solid #e8eaed",
                      borderRadius: 12,
                      padding: 20,
                      opacity: plan.is_active ? 1 : 0.6,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#0f1117",
                            marginBottom: 4,
                          }}
                        >
                          {plan.name}
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#6b7280",
                              background: "#f0f1f5",
                              padding: "2px 8px",
                              borderRadius: 99,
                            }}
                          >
                            {plan.slug}
                          </span>
                          {!plan.is_active && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#dc2626",
                                background: "#fef2f2",
                                padding: "2px 8px",
                                borderRadius: 99,
                              }}
                            >
                              Inativo
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPlan(plan);
                          setIsPlanModalOpen(true);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#9ca3af",
                          cursor: "pointer",
                        }}
                      >
                        <Pencil style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#4b5563",
                        marginBottom: 16,
                        flex: 1,
                      }}
                    >
                      {plan.description}
                    </p>

                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        background: "#f9fafb",
                        padding: 12,
                        borderRadius: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <span>Profissionais:</span>{" "}
                        <strong>
                          {plan.max_professionals === -1
                            ? "Ilimitado"
                            : plan.max_professionals}
                        </strong>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <span>WhatsApp:</span>{" "}
                        <strong>{plan.max_whatsapp_connections}</strong>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Google Calendar:</span>{" "}
                        <strong>
                          {plan.max_google_calendars === -1
                            ? "Ilimitado"
                            : plan.max_google_calendars}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
                {plans.length === 0 && (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      padding: "40px",
                      color: "#6b7280",
                      fontSize: 14,
                    }}
                  >
                    Nenhum plano cadastrado.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ paddingTop: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <div>
                  <h2
                    style={{ fontSize: 18, fontWeight: 700, color: "#0f1117" }}
                  >
                    Ofertas Promocionais
                  </h2>
                  <p style={{ fontSize: 13, color: "#6b7280" }}>
                    Gerencie as ofertas e cupons de desconto
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedOffer(null);
                    setIsOfferModalOpen(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    background: "#1a1a2e",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Plus style={{ width: 14, height: 14 }} /> Nova Oferta
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 16,
                }}
              >
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    style={{
                      background: "white",
                      border: "1px solid #e8eaed",
                      borderRadius: 12,
                      padding: 20,
                      opacity: offer.is_active ? 1 : 0.6,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#0f1117",
                            marginBottom: 4,
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          {offer.token}
                        </h3>
                        {offer.plan && (
                          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                            Plano: {offer.plan.name}
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {!offer.is_active && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#dc2626",
                                background: "#fef2f2",
                                padding: "2px 8px",
                                borderRadius: 99,
                              }}
                            >
                              Inativo
                            </span>
                          )}
                          {offer.enforce_price_lock && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#059669",
                                background: "#ecfdf5",
                                padding: "2px 8px",
                                borderRadius: 99,
                              }}
                            >
                              Price Lock
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {(!offer.cycles || offer.cycles.length === 0) ? (
                          <button
                            onClick={() => {
                              const planSlug = offer.plan?.slug || 'professional';
                              const url = `${window.location.origin}/pt-BR/billing-setup?plan=${planSlug}&billing=MONTHLY&offer=${offer.token}`;
                              navigator.clipboard.writeText(url).then(() => {
                                setCopiedOfferId(offer.id);
                                setTimeout(() => setCopiedOfferId(null), 2000);
                              });
                            }}
                            title="Copiar Link"
                            style={{
                              background: "transparent",
                              border: "none",
                              color: copiedOfferId === offer.id ? "#059669" : "#9ca3af",
                              cursor: "pointer",
                            }}
                          >
                            {copiedOfferId === offer.id ? (
                              <Check style={{ width: 16, height: 16 }} />
                            ) : (
                              <Link2 style={{ width: 16, height: 16 }} />
                            )}
                          </button>
                        ) : (
                          offer.cycles.map(cycle => (
                            <button
                              key={cycle.cycle_type}
                              onClick={() => {
                                const planSlug = offer.plan?.slug || 'professional';
                                const billing = cycle.cycle_type === 'yearly' ? 'YEARLY' : 'MONTHLY';
                                const url = `${window.location.origin}/pt-BR/billing-setup?plan=${planSlug}&billing=${billing}&offer=${offer.token}`;
                                navigator.clipboard.writeText(url).then(() => {
                                  setCopiedOfferId(`${offer.id}-${cycle.cycle_type}`);
                                  setTimeout(() => setCopiedOfferId(null), 2000);
                                });
                              }}
                              title={`Copiar Link (${cycle.cycle_type === 'yearly' ? 'Anual' : 'Mensal'})`}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: copiedOfferId === `${offer.id}-${cycle.cycle_type}` ? "#059669" : "#9ca3af",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                fontSize: 11,
                                fontWeight: 500,
                              }}
                            >
                              {copiedOfferId === `${offer.id}-${cycle.cycle_type}` ? (
                                <Check style={{ width: 14, height: 14 }} />
                              ) : (
                                <Link2 style={{ width: 14, height: 14 }} />
                              )}
                              {cycle.cycle_type === 'yearly' ? 'Anual' : 'Mensal'}
                            </button>
                          ))
                        )}
                        <button
                          onClick={() => {
                            setSelectedOffer(offer);
                            setIsOfferModalOpen(true);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#9ca3af",
                            cursor: "pointer",
                          }}
                        >
                          <Pencil style={{ width: 16, height: 16 }} />
                        </button>
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#4b5563",
                        marginBottom: 16,
                        flex: 1,
                      }}
                    >
                      {offer.description}
                    </p>

                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        background: "#f9fafb",
                        padding: 12,
                        borderRadius: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <span>Usos:</span>{" "}
                        <strong>
                          {offer.current_uses} /{" "}
                          {offer.max_uses === 0 ? "Ilimitado" : offer.max_uses}
                        </strong>
                      </div>
                      {offer.expires_at && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>Expira em:</span>{" "}
                          <strong>
                            {new Date(offer.expires_at).toLocaleDateString(
                              "pt-BR",
                            )}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {offers.length === 0 && (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      padding: "40px",
                      color: "#6b7280",
                      fontSize: 14,
                    }}
                  >
                    Nenhuma oferta cadastrada.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <PlanFormModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        plan={selectedPlan}
        onSave={handleSavePlan}
      />

      <OfferFormModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        offer={selectedOffer}
        plans={plans}
        onSave={handleSaveOffer}
      />

      {/* Toast */}
      <div
        style={{
          position: "fixed",
          bottom: 28,
          left: "50%",
          transform: `translateX(-50%) translateY(${toast.visible ? "0" : "10px"})`,
          background: "#0f1117",
          color: "white",
          padding: "10px 20px",
          borderRadius: 10,
          fontSize: 13.5,
          fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          opacity: toast.visible ? 1 : 0,
          transition: "all 250ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        <Check style={{ width: 14, height: 14, color: "#34d399" }} />
        {toast.message}
      </div>

      {/* Keyframe for spinner */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── SUB-COMPONENTS ───

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

function SectionCard({
  icon,
  title,
  subtitle,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e8eaed",
        borderRadius: 16,
        marginBottom: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        overflow: "hidden",
        transition: "box-shadow 180ms ease",
        animation: `fadeUp 320ms ease ${delay}ms backwards`,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow =
          "0 4px 16px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow =
          "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)")
      }
    >
      {/* Header */}
      <div
        style={{
          padding: "22px 28px 18px",
          borderBottom: "1px solid #e8eaed",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#f0f1f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#0f1117",
              letterSpacing: -0.2,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 1 }}>
            {subtitle}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

function FieldRow({
  label,
  description,
  children,
  isLast = false,
}: {
  label: string;
  description: React.ReactNode;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      style={{
        padding: "20px 0",
        borderBottom: isLast ? "none" : "1px solid #e8eaed",
        display: "grid",
        gridTemplateColumns: "1fr 180px",
        alignItems: "center",
        gap: 24,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#0f1117",
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.4 }}>
          {description}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Stepper({
  value,
  onStep,
  onChange,
  min = 0,
}: {
  value: string;
  onStep: (delta: number) => void;
  onChange: (value: string) => void;
  min?: number;
}) {
  const btnStyle: React.CSSProperties = {
    width: 36,
    height: 40,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontSize: 18,
    fontWeight: 400,
    lineHeight: 1,
    flexShrink: 0,
    transition: "background 180ms ease, color 180ms ease",
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "#f9fafb",
        border: "1.5px solid #e8eaed",
        borderRadius: 8,
        overflow: "hidden",
        width: "fit-content",
        transition: "border-color 180ms ease, box-shadow 180ms ease",
      }}
    >
      <button
        style={btnStyle}
        onClick={() => onStep(-1)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#e8eaed";
          e.currentTarget.style.color = "#0f1117";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#6b7280";
        }}
      >
        <Minus style={{ width: 14, height: 14 }} />
      </button>
      <div
        style={{ width: 1, height: 22, background: "#e8eaed", flexShrink: 0 }}
      />
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        style={{
          border: "none",
          background: "transparent",
          padding: 0,
          fontSize: 14,
          fontWeight: 700,
          color: "#0f1117",
          fontFamily: "'DM Mono', monospace",
          width: 52,
          height: 40,
          outline: "none",
          textAlign: "center",
          MozAppearance: "textfield" as any,
        }}
      />
      <div
        style={{ width: 1, height: 22, background: "#e8eaed", flexShrink: 0 }}
      />
      <button
        style={btnStyle}
        onClick={() => onStep(1)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#e8eaed";
          e.currentTarget.style.color = "#0f1117";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#6b7280";
        }}
      >
        <Plus style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}

function CurrencyInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "#f9fafb",
        border: "1.5px solid #e8eaed",
        borderRadius: 8,
        overflow: "hidden",
        transition: "border-color 180ms ease, box-shadow 180ms ease",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#1a1a2e";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,26,46,0.12)";
        e.currentTarget.style.background = "white";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#e8eaed";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.background = "#f9fafb";
      }}
    >
      <span
        style={{
          padding: "0 10px 0 12px",
          fontSize: 13,
          fontWeight: 600,
          color: "#6b7280",
          fontFamily: "'DM Mono', monospace",
          borderRight: "1.5px solid #e8eaed",
          height: 40,
          display: "flex",
          alignItems: "center",
          background: "white",
          flexShrink: 0,
        }}
      >
        R$
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: "none",
          background: "transparent",
          padding: "0 12px",
          fontSize: 14,
          fontWeight: 600,
          color: "#0f1117",
          fontFamily: "'DM Mono', monospace",
          width: "100%",
          height: 40,
          outline: "none",
          MozAppearance: "textfield" as any,
        }}
      />
    </div>
  );
}

function PlanCard({
  label,
  value,
  onChange,
  limitText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  limitText: string;
}) {
  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1.5px solid #e8eaed",
        borderRadius: 12,
        padding: 16,
        transition: "border-color 180ms ease, box-shadow 180ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#c5c9d3";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e8eaed";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          textTransform: "uppercase" as const,
          letterSpacing: 0.6,
          color: "#6b7280",
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <CurrencyInput value={value} onChange={onChange} />
      <div
        style={{
          fontSize: 11,
          color: "#9ca3af",
          marginTop: 8,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Info style={{ width: 10, height: 10, flexShrink: 0 }} />
        {limitText}
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      style={{
        position: "relative",
        width: 44,
        height: 24,
        flexShrink: 0,
        cursor: "pointer",
        display: "inline-block",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: checked ? "#1a1a2e" : "#e8eaed",
          borderRadius: 99,
          cursor: "pointer",
          transition: "background 200ms ease",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 3,
          left: 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          transition: "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          transform: checked ? "translateX(20px)" : "translateX(0)",
          pointerEvents: "none",
        }}
      />
    </label>
  );
}
