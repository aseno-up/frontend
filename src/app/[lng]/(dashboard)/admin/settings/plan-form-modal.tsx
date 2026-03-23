"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, Loader2 } from "lucide-react";
import type { Plan, CreatePlanRequest, UpdatePlanRequest } from "@/types/api";

interface PlanFormModalProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePlanRequest | UpdatePlanRequest) => Promise<void>;
}

export function PlanFormModal({
  plan,
  isOpen,
  onClose,
  onSave,
}: PlanFormModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Plan>>({
    name: "",
    slug: "",
    description: "",
    features: [""],
    max_clinics: 1,
    max_professionals: 5,
    max_whatsapp_connections: 0,
    max_google_calendars: 0,
    has_api_access: false,
    is_active: true,
  });

  // We'll manage cycles separately for simplicity
  const [cycles, setCycles] = useState<
    Array<{ cycle_type: "monthly" | "yearly" | "lifetime"; price_brl: string }>
  >([{ cycle_type: "monthly", price_brl: "0" }]);

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        features: plan.features?.length > 0 ? plan.features : [""],
        max_clinics: plan.max_clinics,
        max_professionals: plan.max_professionals,
        max_whatsapp_connections: plan.max_whatsapp_connections,
        max_google_calendars: plan.max_google_calendars,
        has_api_access: plan.has_api_access,
        is_active: plan.is_active,
      });
      if (plan.cycles?.length > 0) {
        setCycles(
          plan.cycles.map((c) => ({
            cycle_type: c.cycle_type,
            price_brl: c.price_brl.toString(),
          })),
        );
      } else {
        setCycles([{ cycle_type: "monthly", price_brl: "0" }]);
      }
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        features: [""],
        max_clinics: 1,
        max_professionals: 5,
        max_whatsapp_connections: 0,
        max_google_calendars: 0,
        has_api_access: false,
        is_active: true,
      });
      setCycles([{ cycle_type: "monthly", price_brl: "0" }]);
    }
  }, [plan, isOpen]);

  if (!isOpen) return null;

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...(formData.features || [])];
    newFeatures[index] = value;
    setFormData((prev) => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...(prev.features || []), ""],
    }));
  };

  const removeFeature = (index: number) => {
    const newFeatures = [...(formData.features || [])];
    newFeatures.splice(index, 1);
    if (newFeatures.length === 0) newFeatures.push("");
    setFormData((prev) => ({ ...prev, features: newFeatures }));
  };

  const handleCycleChange = (
    index: number,
    key: keyof (typeof cycles)[0],
    value: string,
  ) => {
    const newCycles = [...cycles];
    newCycles[index] = { ...newCycles[index], [key]: value } as any;
    setCycles(newCycles);
  };

  const addCycle = () => {
    setCycles((prev) => [...prev, { cycle_type: "yearly", price_brl: "0" }]);
  };

  const removeCycle = (index: number) => {
    const newCycles = [...cycles];
    newCycles.splice(index, 1);
    setCycles(newCycles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clean up empty features
    const cleanFeatures =
      formData.features?.filter((f) => f.trim() !== "") || [];

    // Parse cycles
    const cleanCycles = cycles.map((c) => ({
      cycle_type: c.cycle_type,
      price_brl: parseFloat(c.price_brl) || 0,
    }));

    const submitData = {
      ...formData,
      features: cleanFeatures,
      cycles: cleanCycles,
    };

    try {
      setIsSaving(true);
      await onSave(submitData as CreatePlanRequest);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(15, 17, 23, 0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e8eaed",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0f1117",
              margin: 0,
            }}
          >
            {plan ? "Editar Plano" : "Novo Plano"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: "24px",
            overflowY: "auto",
            flex: 1,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <form
            id="plan-form"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <label style={labelStyle}>Nome do Plano *</label>
                <input
                  required
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  style={inputStyle}
                  placeholder="Ex: Profissional"
                />
              </div>
              <div>
                <label style={labelStyle}>Slug *</label>
                <input
                  required
                  value={formData.slug || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, slug: e.target.value }))
                  }
                  style={inputStyle}
                  placeholder="Ex: professional"
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Descrição</label>
              <input
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                style={inputStyle}
                placeholder="Ex: Ideal para clínicas em crescimento"
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <label style={labelStyle}>Limite de Profissionais</label>
                <input
                  type="number"
                  required
                  min="-1"
                  value={formData.max_professionals}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      max_professionals: parseInt(e.target.value) || 0,
                    }))
                  }
                  style={inputStyle}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  -1 para ilimitado
                </span>
              </div>
              <div>
                <label style={labelStyle}>Máx Conexões WhatsApp</label>
                <input
                  type="number"
                  required
                  min="-1"
                  value={formData.max_whatsapp_connections}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      max_whatsapp_connections: parseInt(e.target.value) || 0,
                    }))
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <label style={labelStyle}>Máx Calendários Google</label>
                <input
                  type="number"
                  required
                  min="-1"
                  value={formData.max_google_calendars}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      max_google_calendars: parseInt(e.target.value) || 0,
                    }))
                  }
                  style={inputStyle}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 24,
                }}
              >
                <input
                  type="checkbox"
                  id="has_api"
                  checked={formData.has_api_access || false}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      has_api_access: e.target.checked,
                    }))
                  }
                />
                <label
                  htmlFor="has_api"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#0f1117",
                    cursor: "pointer",
                  }}
                >
                  Acesso à API
                </label>
              </div>
            </div>

            {/* Features section */}
            <div
              style={{
                marginTop: 8,
                paddingTop: 20,
                borderTop: "1px dashed #e8eaed",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  Funcionalidades (Lista)
                </label>
                <button
                  type="button"
                  onClick={addFeature}
                  style={{
                    background: "transparent",
                    border: "1px solid #e8eaed",
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#1a1a2e",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Plus style={{ width: 12, height: 12 }} /> Adicionar
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {formData.features?.map((feat, index) => (
                  <div key={index} style={{ display: "flex", gap: 8 }}>
                    <input
                      value={feat}
                      onChange={(e) =>
                        handleFeatureChange(index, e.target.value)
                      }
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder={`Funcionalidade ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: 8,
                        width: 40,
                        color: "#dc2626",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Minus style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cycles section */}
            <div
              style={{
                marginTop: 8,
                paddingTop: 20,
                borderTop: "1px dashed #e8eaed",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  Ciclos de Cobrança (Preços)
                </label>
                <button
                  type="button"
                  onClick={addCycle}
                  style={{
                    background: "transparent",
                    border: "1px solid #e8eaed",
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#1a1a2e",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Plus style={{ width: 12, height: 12 }} /> Adicionar
                </button>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {cycles.map((cycle, index) => (
                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr auto",
                      gap: 8,
                      background: "#f9fafb",
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #e8eaed",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#6b7280",
                          marginBottom: 4,
                          display: "block",
                        }}
                      >
                        Período
                      </label>
                      <select
                        value={cycle.cycle_type}
                        onChange={(e) =>
                          handleCycleChange(index, "cycle_type", e.target.value)
                        }
                        style={inputStyle}
                      >
                        <option value="monthly">Mensal</option>
                        <option value="yearly">Anual</option>
                        <option value="lifetime">Vitalício</option>
                      </select>
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#6b7280",
                          marginBottom: 4,
                          display: "block",
                        }}
                      >
                        Preço (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={cycle.price_brl}
                        onChange={(e) =>
                          handleCycleChange(index, "price_brl", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => removeCycle(index)}
                        disabled={cycles.length === 1}
                        style={{
                          background:
                            cycles.length === 1 ? "#f3f4f6" : "#fef2f2",
                          border: `1px solid ${cycles.length === 1 ? "#e5e7eb" : "#fecaca"}`,
                          borderRadius: 8,
                          height: 40,
                          width: 40,
                          color: cycles.length === 1 ? "#9ca3af" : "#dc2626",
                          cursor:
                            cycles.length === 1 ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Minus style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 8,
              }}
            >
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active || false}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, is_active: e.target.checked }))
                }
              />
              <label
                htmlFor="is_active"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#0f1117",
                  cursor: "pointer",
                }}
              >
                Plano Ativo (Visível para clientes)
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e8eaed",
            background: "#f9fafb",
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: "white",
              color: "#1a1a2e",
              border: "1px solid #d1d5db",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="plan-form"
            disabled={isSaving}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: "#1a1a2e",
              color: "white",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {isSaving && (
              <Loader2
                style={{
                  width: 14,
                  height: 14,
                  animation: "spin 1s linear infinite",
                }}
              />
            )}
            Salvar Plano
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#4b5563",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1.5px solid #e5e7eb",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 150ms",
};
