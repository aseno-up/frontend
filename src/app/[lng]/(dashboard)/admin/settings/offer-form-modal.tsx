"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, Loader2 } from "lucide-react";
import type {
  Offer,
  Plan,
  CreateOfferRequest,
  UpdateOfferRequest,
} from "@/types/api";

interface OfferFormModalProps {
  offer: Offer | null;
  plans: Plan[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateOfferRequest | UpdateOfferRequest) => Promise<void>;
}

export function OfferFormModal({
  offer,
  plans,
  isOpen,
  onClose,
  onSave,
}: OfferFormModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Offer>>({
    plan_id: "",
    token: "",
    description: "",
    is_active: true,
    max_uses: 0,
    enforce_price_lock: true,
    expires_at: "",
  });

  const [cycles, setCycles] = useState<
    Array<{
      cycle_type: "monthly" | "yearly" | "lifetime";
      custom_price_brl: string;
    }>
  >([{ cycle_type: "monthly", custom_price_brl: "0" }]);

  useEffect(() => {
    if (offer) {
      setFormData({
        plan_id: offer.plan_id,
        token: offer.token,
        description: offer.description,
        is_active: offer.is_active,
        max_uses: offer.max_uses,
        enforce_price_lock: offer.enforce_price_lock,
        expires_at: offer.expires_at ? offer.expires_at.split("T")[0] : "",
      });

      if (offer.cycles?.length > 0) {
        setCycles(
          offer.cycles.map((c) => ({
            cycle_type: c.cycle_type,
            custom_price_brl: c.custom_price_brl.toString(),
          })),
        );
      } else {
        setCycles([{ cycle_type: "monthly", custom_price_brl: "0" }]);
      }
    } else {
      setFormData({
        plan_id: plans.length > 0 ? plans[0].id : "",
        token: "",
        description: "",
        is_active: true,
        max_uses: 0,
        enforce_price_lock: true,
        expires_at: "",
      });
      setCycles([{ cycle_type: "monthly", custom_price_brl: "0" }]);
    }
  }, [offer, isOpen]);

  if (!isOpen) return null;

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
    setCycles((prev) => [
      ...prev,
      { cycle_type: "monthly", custom_price_brl: "0" },
    ]);
  };

  const removeCycle = (index: number) => {
    const newCycles = [...cycles];
    newCycles.splice(index, 1);
    setCycles(newCycles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse cycles
    const cleanCycles = cycles.map((c) => ({
      cycle_type: c.cycle_type,
      custom_price_brl: parseFloat(c.custom_price_brl) || 0,
    }));

    const submitData = {
      ...formData,
      expires_at: formData.expires_at
        ? new Date(formData.expires_at).toISOString()
        : undefined,
      cycles: cleanCycles,
    };

    try {
      setIsSaving(true);
      await onSave(submitData as CreateOfferRequest);
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
          maxWidth: 540,
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
            {offer ? "Editar Oferta" : "Nova Oferta (Cupom)"}
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
            id="offer-form"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <div>
              <label style={labelStyle}>Plano *</label>
              <select
                required
                value={formData.plan_id || ""}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, plan_id: e.target.value }))
                }
                style={inputStyle}
              >
                <option value="" disabled>Selecione o plano</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.slug})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Token do Cupom *</label>
              <input
                required
                value={formData.token || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    token: e.target.value.toUpperCase(),
                  }))
                }
                style={{ ...inputStyle, textTransform: "uppercase" }}
                placeholder="Ex: BLACKFRIDAY50"
              />
            </div>

            <div>
              <label style={labelStyle}>Descrição</label>
              <input
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                style={inputStyle}
                placeholder="Ex: Oferta especial de Black Friday"
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
                <label style={labelStyle}>Validade Máxima (Opcional)</label>
                <input
                  type="date"
                  value={formData.expires_at || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, expires_at: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Limite de Usos (0 = ilimitado)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.max_uses || 0}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      max_uses: parseInt(e.target.value) || 0,
                    }))
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Configs extras */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  id="enforce_price_lock"
                  checked={formData.enforce_price_lock || false}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      enforce_price_lock: e.target.checked,
                    }))
                  }
                />
                <label
                  htmlFor="enforce_price_lock"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#0f1117",
                    cursor: "pointer",
                  }}
                >
                  Travar preço atualizado em futuras renovações (Price Lock)
                </label>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  id="is_active_offer"
                  checked={formData.is_active || false}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, is_active: e.target.checked }))
                  }
                />
                <label
                  htmlFor="is_active_offer"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#0f1117",
                    cursor: "pointer",
                  }}
                >
                  Cupom Ativo
                </label>
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
                <div>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    Valores Promocionais
                  </label>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    Substitui o valor original do plano.
                  </div>
                </div>
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
                        Período Alvo
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
                        value={cycle.custom_price_brl}
                        onChange={(e) =>
                          handleCycleChange(
                            index,
                            "custom_price_brl",
                            e.target.value,
                          )
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
            form="offer-form"
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
            Salvar Oferta
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
