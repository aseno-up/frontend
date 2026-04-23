"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const [cycles, setCycles] = useState<
    Array<{
      cycle_type: "monthly" | "yearly" | "lifetime";
      price_brl: string;
      solo_price_brl: string;
    }>
  >([{ cycle_type: "monthly", price_brl: "0", solo_price_brl: "" }]);

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
            solo_price_brl:
              c.solo_price_brl != null ? c.solo_price_brl.toString() : "",
          })),
        );
      } else {
        setCycles([{ cycle_type: "monthly", price_brl: "0", solo_price_brl: "" }]);
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
      setCycles([{ cycle_type: "monthly", price_brl: "0", solo_price_brl: "" }]);
    }
  }, [plan, isOpen]);

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
    setCycles((prev) => [
      ...prev,
      { cycle_type: "yearly", price_brl: "0", solo_price_brl: "" },
    ]);
  };

  const removeCycle = (index: number) => {
    const newCycles = [...cycles];
    newCycles.splice(index, 1);
    setCycles(newCycles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanFeatures =
      formData.features?.filter((f) => f.trim() !== "") || [];

    const cleanCycles = cycles.map((c) => {
      const soloRaw = c.solo_price_brl.trim();
      const soloParsed = soloRaw === "" ? null : parseFloat(soloRaw);
      return {
        cycle_type: c.cycle_type,
        price_brl: parseFloat(c.price_brl) || 0,
        solo_price_brl:
          soloParsed === null || Number.isNaN(soloParsed) ? null : soloParsed,
      };
    });

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-5 border-b shrink-0">
          <DialogTitle>
            {plan ? "Editar Plano" : "Novo Plano"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form
            id="plan-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nome do Plano *</Label>
                <Input
                  required
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Ex: Profissional"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Slug *</Label>
                <Input
                  required
                  value={formData.slug || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, slug: e.target.value }))
                  }
                  placeholder="Ex: professional"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Descricao</Label>
              <Input
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Ex: Ideal para clinicas em crescimento"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Limite de Profissionais</Label>
                <Input
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
                />
                <span className="text-[11px] text-muted-foreground">
                  -1 para ilimitado
                </span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Max Conexoes WhatsApp</Label>
                <Input
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
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Max Calendarios Google</Label>
                <Input
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
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
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
                  className="rounded"
                />
                <label
                  htmlFor="has_api"
                  className="text-[13px] font-medium cursor-pointer"
                >
                  Acesso a API
                </label>
              </div>
            </div>

            {/* Features section */}
            <div className="mt-2 pt-5 border-t border-dashed">
              <div className="flex justify-between items-center mb-3">
                <Label className="text-xs font-semibold">Funcionalidades (Lista)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={addFeature}
                >
                  <Plus className="h-3 w-3" /> Adicionar
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                {formData.features?.map((feat, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feat}
                      onChange={(e) =>
                        handleFeatureChange(index, e.target.value)
                      }
                      className="flex-1"
                      placeholder={`Funcionalidade ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
                      onClick={() => removeFeature(index)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cycles section */}
            <div className="mt-2 pt-5 border-t border-dashed">
              <div className="flex justify-between items-center mb-3">
                <Label className="text-xs font-semibold">Ciclos de Cobranca (Precos)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={addCycle}
                >
                  <Plus className="h-3 w-3" /> Adicionar
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {cycles.map((cycle, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 bg-muted/50 p-3 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        Periodo
                      </Label>
                      <Select
                        value={cycle.cycle_type}
                        onValueChange={(v) =>
                          handleCycleChange(index, "cycle_type", v)
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                          <SelectItem value="lifetime">Vitalicio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        Clínica (R$)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={cycle.price_brl}
                        onChange={(e) =>
                          handleCycleChange(index, "price_brl", e.target.value)
                        }
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        Autônomo (R$)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="vazio = sem opção"
                        value={cycle.solo_price_brl}
                        onChange={(e) =>
                          handleCycleChange(
                            index,
                            "solo_price_brl",
                            e.target.value,
                          )
                        }
                        className="h-9"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className={`h-9 w-9 ${cycles.length === 1 ? "opacity-40 cursor-not-allowed" : "text-destructive border-destructive/30 hover:bg-destructive/10"}`}
                        onClick={() => removeCycle(index)}
                        disabled={cycles.length === 1}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active || false}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, is_active: e.target.checked }))
                }
                className="rounded"
              />
              <label
                htmlFor="is_active"
                className="text-[13px] font-medium cursor-pointer"
              >
                Plano Ativo (Visivel para clientes)
              </label>
            </div>
          </form>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 shrink-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="plan-form" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Plano
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
