"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { showToast } from "@/lib/toast"
import type { PaymentMethod, PaymentMethodType, SettlementMode } from "@/types/api"

const TYPE_OPTIONS: { value: PaymentMethodType; label: string }[] = [
  { value: "pix", label: "PIX" },
  { value: "credit", label: "Cartão de Crédito" },
  { value: "debit", label: "Cartão de Débito" },
  { value: "cash", label: "Dinheiro" },
  { value: "transfer", label: "Transferência" },
  { value: "other", label: "Outro" },
]

interface PaymentMethodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: PaymentMethod | null
  onSave: (payload: {
    name: string
    type: PaymentMethodType
    settlement_days: number
    installments_allowed: boolean
    max_installments: number
    settlement_mode: SettlementMode
    active?: boolean
  }) => Promise<void>
}

// PaymentMethodDialog edits a single payment method through a focused modal
// instead of the prior cramped inline form. Each control carries an
// explanatory description so the user understands what "settlement days" or
// "monthly" means without having to memorize jargon.
export function PaymentMethodDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: PaymentMethodDialogProps) {
  const isEditing = !!initial

  const [name, setName] = useState("")
  const [type, setType] = useState<PaymentMethodType>("pix")
  // Allow empty during typing per CLAUDE.md UX rule. Validation runs on save.
  const [settlementDays, setSettlementDays] = useState<number | "">(0)
  const [installmentsAllowed, setInstallmentsAllowed] = useState(false)
  const [maxInstallments, setMaxInstallments] = useState<number | "">(1)
  const [settlementMode, setSettlementMode] = useState<SettlementMode>("monthly")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setName(initial.name)
      setType(initial.type)
      setSettlementDays(initial.settlement_days)
      setInstallmentsAllowed(initial.installments_allowed)
      setMaxInstallments(initial.max_installments)
      // Legacy 'fixed_days' rows fold into 'monthly' — surface the canonical
      // option in the UI so the user doesn't see a vanished mode.
      const mode = initial.settlement_mode === "fixed_days" ? "monthly" : (initial.settlement_mode || "monthly")
      setSettlementMode(mode)
    } else {
      setName("")
      setType("pix")
      setSettlementDays(0)
      setInstallmentsAllowed(false)
      setMaxInstallments(1)
      setSettlementMode("monthly")
    }
  }, [open, initial])

  const handleSave = async () => {
    if (!name.trim()) {
      showToast.error("Informe o nome do método.")
      return
    }
    const finalSettlementDays = typeof settlementDays === "number" && settlementDays >= 0 ? settlementDays : 0
    const finalMaxInstallments = typeof maxInstallments === "number" && maxInstallments >= 1 ? maxInstallments : 1
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        type,
        settlement_days: finalSettlementDays,
        installments_allowed: installmentsAllowed,
        max_installments: installmentsAllowed ? finalMaxInstallments : 1,
        settlement_mode: settlementMode,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const sd = typeof settlementDays === "number" ? settlementDays : 0
  const mi = typeof maxInstallments === "number" ? maxInstallments : 1
  const exampleDue =
    sd === 0
      ? "no mesmo dia da venda"
      : `${sd} dia${sd === 1 ? "" : "s"} após a venda`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar forma de pagamento" : "Nova forma de pagamento"}
          </DialogTitle>
          <DialogDescription>
            Configure como o valor entra na sua conta. Esses parâmetros valem
            para todas as vendas e atendimentos pagos com este método.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Maquininha Stone"
                autoFocus
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Como aparece nas listas de venda e nos relatórios.
              </p>
            </div>
            <div>
              <Label className="text-sm">Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as PaymentMethodType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Categoria usada nos relatórios financeiros.
              </p>
            </div>
          </div>

          <div className="rounded-md border p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label className="text-sm">Aceita parcelamento</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Marque se este método pode parcelar uma venda em mais de uma cobrança.
                  Geralmente só cartão de crédito.
                </p>
              </div>
              <Switch
                checked={installmentsAllowed}
                onCheckedChange={setInstallmentsAllowed}
              />
            </div>

            {installmentsAllowed && (
              <div>
                <Label className="text-sm">Máximo de parcelas</Label>
                <Input
                  type="number"
                  min={1}
                  value={maxInstallments === "" ? "" : maxInstallments}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === "") {
                      setMaxInstallments("")
                      return
                    }
                    const n = parseInt(v, 10)
                    if (Number.isNaN(n)) return
                    setMaxInstallments(n)
                  }}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Limite de parcelas que aparecerá no momento da venda (ex.: 12).
                </p>
              </div>
            )}
          </div>

          <div className="rounded-md border p-4 space-y-4">
            <div>
              <Label className="text-sm">Quando o valor entra na sua conta?</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Configure conforme o acordo com o banco/maquininha.
              </p>
            </div>

            <div>
              <Label className="text-sm">Prazo de recebimento</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  className="max-w-[120px]"
                  value={settlementDays === "" ? "" : settlementDays}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === "") {
                      setSettlementDays("")
                      return
                    }
                    const n = parseInt(v, 10)
                    if (Number.isNaN(n)) return
                    setSettlementDays(n)
                  }}
                />
                <span className="text-sm text-muted-foreground">dias após a venda</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Para PIX, dinheiro ou débito normalmente é <b>0</b> (cai no mesmo dia).
                Para cartão de crédito o padrão das maquininhas costuma ser <b>30</b> dias.
              </p>
            </div>

            {installmentsAllowed && mi > 1 && (
              <div>
                <Label className="text-sm">Como o banco repassa as parcelas?</Label>
                <Select
                  value={settlementMode}
                  onValueChange={(v) => setSettlementMode(v as SettlementMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upfront">
                      Tudo de uma vez, em {sd} dia{sd === 1 ? "" : "s"}
                    </SelectItem>
                    <SelectItem value="monthly">
                      Mês a mês (uma parcela por mês)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  {settlementMode === "upfront" ? (
                    <>
                      <b>Tudo de uma vez</b>: o banco paga o valor total da venda em
                      uma única entrada, em {sd} dia{sd === 1 ? "" : "s"} após a venda. No caixa
                      aparece <b>1 conta a receber</b>, mesmo que o cliente parcele.
                    </>
                  ) : (
                    <>
                      <b>Mês a mês</b>: a parcela 1 cai em {sd} dia{sd === 1 ? "" : "s"} após a venda, e cada parcela
                      seguinte cai 1 mês depois da anterior. No caixa aparece{" "}
                      <b>1 conta a receber por parcela</b>.
                    </>
                  )}
                </p>
              </div>
            )}

            <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Exemplo:</span>{" "}
              uma venda à vista cai {exampleDue}.
              {installmentsAllowed && mi > 1 && (
                <>
                  {" "}Se for parcelada,{" "}
                  {settlementMode === "upfront"
                    ? `o valor total cai de uma vez, em ${settlementDays || 0} dia${settlementDays === 1 ? "" : "s"}.`
                    : "cada parcela seguinte cai 1 mês depois da anterior."}
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Salvar alterações" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
