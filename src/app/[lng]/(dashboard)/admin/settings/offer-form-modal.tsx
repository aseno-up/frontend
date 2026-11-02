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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-5 border-b shrink-0">
          <DialogTitle>
            {offer ? "Editar Oferta" : "Nova Oferta (Cupom)"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form
            id="offer-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Plano *</Label>
              <Select
                required
                value={formData.plan_id || ""}
                onValueChange={(v) => setFormData((p) => ({ ...p, plan_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Token do Cupom *</Label>
              <Input
                required
                value={formData.token || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    token: e.target.value.toUpperCase(),
                  }))
                }
                className="uppercase"
                placeholder="Ex: BLACKFRIDAY50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Descricao</Label>
              <Input
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Ex: Oferta especial de Black Friday"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Validade Maxima (Opcional)</Label>
                <Input
                  type="date"
                  value={formData.expires_at || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, expires_at: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Limite de Usos (0 = ilimitado)</Label>
                <Input
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
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-1">
              <div className="flex items-center gap-2">
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
                  className="rounded"
                />
                <label
                  htmlFor="enforce_price_lock"
                  className="text-[13px] font-medium cursor-pointer"
                >
                  Travar preco atualizado em futuras renovacoes (Price Lock)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active_offer"
                  checked={formData.is_active || false}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, is_active: e.target.checked }))
                  }
                  className="rounded"
                />
                <label
                  htmlFor="is_active_offer"
                  className="text-[13px] font-medium cursor-pointer"
                >
                  Cupom Ativo
                </label>
              </div>
            </div>

            {/* Cycles section */}
            <div className="mt-2 pt-5 border-t border-dashed">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <Label className="text-xs font-semibold">Valores Promocionais</Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Substitui o valor original do plano.
                  </p>
                </div>
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
                    className="grid grid-cols-[1fr_1fr_auto] gap-2 bg-muted/50 p-3 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        Periodo Alvo
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
                        Preco (R$)
                      </Label>
                      <Input
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
          </form>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 shrink-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="offer-form" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Oferta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
