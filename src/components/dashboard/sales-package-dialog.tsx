"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, Trash2, Pencil, Percent, DollarSign } from "lucide-react"
import { format } from "date-fns"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ReactSelect, ReactCreatableSelect, SelectOption } from "@/components/ui/react-select"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Badge } from "@/components/ui/badge"
import { SalesPackageWhatsAppButton } from "@/components/dashboard/sales-package-whatsapp-button"
import { api } from "@/lib/api/client"
import { handleApiError, showToast } from "@/lib/toast"
import { formatPhone, cn } from "@/lib/utils"
import type {
  CreateSalesPackagePaymentInput,
  Patient,
  Procedure,
  SalesPackage,
} from "@/types/api"

// --- Local row shapes -----------------------------------------------------

interface ItemRow {
  id: string
  procedure_id: string
  procedure_name: string
  unit_price: number
  // Empty quantity is allowed in UI so the user can clear and retype.
  quantity: number | ""
}

interface PaymentRow {
  id: string
  payment_method_id: string
  amount: number
  discount: number
  installments: number
  paid_at: string
}

interface PaymentMethodLite {
  id: string
  name: string
  type: string
  active: boolean
  settlement_days: number
  installments_allowed: boolean
  max_installments: number
}

interface SalesPackageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "sale" | "quote"
  existing?: SalesPackage | null
  onSuccess: () => void
}

const todayStr = () => format(new Date(), "yyyy-MM-dd")
const newRowID = () => Math.random().toString(36).slice(2)

// Add days to a YYYY-MM-DD string keeping the same format. Used to derive the
// payment's due date from sale_date + payment method's settlement_days.
function addDaysISO(iso: string, days: number): string {
  if (!iso) return iso
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return format(d, "yyyy-MM-dd")
}

// --- Quick patient creation dialog ----------------------------------------

interface QuickPatientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName: string
  onCreated: (patient: Patient) => void
}

function QuickPatientDialog({ open, onOpenChange, initialName, onCreated }: QuickPatientDialogProps) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(initialName)
    setPhone("")
  }, [open, initialName])

  const handleSave = async () => {
    if (!name.trim()) {
      showToast.error("Informe o nome do cliente.")
      return
    }
    setSaving(true)
    try {
      const created = (await api.createPatient({ name: name.trim(), phone })) as Patient
      showToast.success("Cliente cadastrado.")
      onCreated(created)
      onOpenChange(false)
    } catch (e) {
      handleApiError(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar novo cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 9 9999-9999"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Payment edit dialog --------------------------------------------------

interface PaymentEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: PaymentRow | null
  remaining: number
  paymentMethods: PaymentMethodLite[]
  onSave: (row: PaymentRow) => void
}

function PaymentEditDialog({
  open,
  onOpenChange,
  initial,
  remaining,
  paymentMethods,
  onSave,
}: PaymentEditDialogProps) {
  const isEditing = !!initial
  const activeMethods = useMemo(
    () => paymentMethods.filter((m) => m.active),
    [paymentMethods],
  )

  const [methodId, setMethodId] = useState(initial?.payment_method_id || activeMethods[0]?.id || "")
  const [amount, setAmount] = useState(initial?.amount ?? remaining)
  const [discount, setDiscount] = useState(initial?.discount ?? 0)
  const [installments, setInstallments] = useState(initial?.installments ?? 1)
  const [paidAt, setPaidAt] = useState(initial?.paid_at || "")

  useEffect(() => {
    if (!open) return
    setMethodId(initial?.payment_method_id || activeMethods[0]?.id || "")
    setAmount(initial?.amount ?? remaining)
    setDiscount(initial?.discount ?? 0)
    setInstallments(initial?.installments ?? 1)
    setPaidAt(initial?.paid_at || "")
  }, [open, initial, remaining, activeMethods])

  const method = useMemo(
    () => paymentMethods.find((m) => m.id === methodId),
    [paymentMethods, methodId],
  )
  const canInstall = method?.installments_allowed ?? false
  const maxInstallments = method?.max_installments ?? 1

  const handleSave = () => {
    if (!methodId) {
      showToast.error("Selecione uma forma de pagamento.")
      return
    }
    if (amount <= 0) {
      showToast.error("Valor deve ser maior que zero.")
      return
    }
    if (discount < 0 || discount >= amount) {
      showToast.error("Desconto deve ser menor que o valor.")
      return
    }
    if (installments > 1 && !canInstall) {
      showToast.error("A forma de pagamento selecionada não aceita parcelamento.")
      return
    }
    if (installments > maxInstallments) {
      showToast.error(`Máximo de ${maxInstallments} parcelas para esta forma.`)
      return
    }

    onSave({
      id: initial?.id || newRowID(),
      payment_method_id: methodId,
      amount,
      discount,
      installments,
      paid_at: paidAt,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar pagamento" : "Adicionar pagamento"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Forma de pagamento</Label>
            <ReactSelect
              value={
                methodId ? { value: methodId, label: method?.name || "" } : null
              }
              onChange={(opt) => opt && setMethodId(opt.value)}
              options={activeMethods.map((m) => ({ value: m.id, label: m.name }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor</Label>
              <CurrencyInput value={amount} onChange={(v: number) => setAmount(v)} />
            </div>
            <div>
              <Label>Desconto</Label>
              <CurrencyInput value={discount} onChange={(v: number) => setDiscount(v)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Parcelas</Label>
              <Input
                type="number"
                min={1}
                max={maxInstallments}
                value={installments}
                onChange={(e) =>
                  setInstallments(Math.max(1, parseInt(e.target.value || "1", 10)))
                }
                disabled={!canInstall}
                title={canInstall ? `Até ${maxInstallments}x` : "Esta forma não aceita parcelamento"}
              />
            </div>
            <div>
              <Label>Pago em (opcional)</Label>
              <Input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Se &quot;Pago em&quot; ficar em branco, o valor é registrado como conta a receber.
            A data prevista de recebimento é calculada automaticamente a partir da
            forma de pagamento.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Main dialog ----------------------------------------------------------

export function SalesPackageDialog({
  open,
  onOpenChange,
  mode,
  existing,
  onSuccess,
}: SalesPackageDialogProps) {
  const [patientQuery, setPatientQuery] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodLite[]>([])

  const [saleDate, setSaleDate] = useState(todayStr())
  const [validUntil, setValidUntil] = useState("")
  const [discount, setDiscount] = useState(0)
  // Discount input mode — toggles between absolute amount and a percentage of
  // the subtotal. Only the absolute value is sent to the backend.
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">("amount")
  const [discountPercent, setDiscountPercent] = useState(0)
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<ItemRow[]>([])
  const [payments, setPayments] = useState<PaymentRow[]>([])

  // Procedure picker (top of items section)
  const [pickerProcedureId, setPickerProcedureId] = useState<string>("")

  // Sub-dialogs
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PaymentRow | null>(null)
  const [quickPatientOpen, setQuickPatientOpen] = useState(false)
  const [quickPatientName, setQuickPatientName] = useState("")

  const [submitting, setSubmitting] = useState(false)

  const isReadonly = !!existing && existing.status !== "quote"
  const isConvertingQuote = !!existing && existing.status === "quote" && mode === "sale"
  const showPayments = mode === "sale" || (existing && existing.status === "active")
  const showSaleDate = mode === "sale" || (existing && existing.status !== "quote")

  // --- Initial load ----------------------------------------------------

  useEffect(() => {
    if (!open) return
    Promise.all([
      api.getProcedures({ page: 1, limit: 200 }).then((r) => setProcedures(r.data || [])),
      api.getActivePaymentMethods().then((r) => setPaymentMethods(r.data || r || [])),
    ]).catch(handleApiError)
  }, [open])

  useEffect(() => {
    if (!open || patientQuery.length < 2) {
      setPatients([])
      return
    }
    const handler = setTimeout(async () => {
      try {
        const resp = await api.getPatients({ page: 1, limit: 10, search: patientQuery })
        setPatients(resp.data || [])
      } catch {
        // search is best-effort
      }
    }, 250)
    return () => clearTimeout(handler)
  }, [open, patientQuery])

  // Reset / hydrate form on open.
  useEffect(() => {
    if (!open) return
    if (existing) {
      setSelectedPatient(
        existing.patient_name
          ? ({
              id: existing.patient_id,
              name: existing.patient_name,
              phone: existing.patient_phone || "",
            } as Patient)
          : null,
      )
      setSaleDate(existing.sale_date.slice(0, 10))
      setValidUntil(existing.valid_until ? existing.valid_until.slice(0, 10) : "")
      setDiscount(existing.discount)
      setDiscountMode("amount")
      setNotes(existing.notes || "")
      setItems(
        (existing.items || []).map((it) => ({
          id: it.id,
          procedure_id: it.procedure_id,
          procedure_name: it.procedure?.name || "",
          unit_price: it.unit_price,
          quantity: it.quantity,
        })),
      )
      // Method-less rows on the backend represent the open receivable (the
      // unpaid remainder of a sale) and aren't editable as concrete payments
      // in this dialog — we surface them implicitly via the "X a receber"
      // hint at the bottom of the payments section.
      setPayments(
        (existing.payments || [])
          .filter((p): p is typeof p & { payment_method_id: string } => !!p.payment_method_id)
          .map((p) => ({
            id: p.id,
            payment_method_id: p.payment_method_id,
            amount: p.amount,
            discount: p.discount,
            installments: p.total_installments,
            paid_at: p.paid_at ? p.paid_at.slice(0, 10) : "",
          })),
      )
    } else {
      setSelectedPatient(null)
      setSaleDate(todayStr())
      setValidUntil("")
      setDiscount(0)
      setDiscountMode("amount")
      setDiscountPercent(0)
      setNotes("")
      setItems([])
      setPayments([])
    }
    setPickerProcedureId("")
  }, [open, existing])

  // --- Derived totals --------------------------------------------------

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + it.unit_price * (typeof it.quantity === "number" ? it.quantity : 0),
        0,
      ),
    [items],
  )

  // Effective discount in $: depends on the mode.
  const effectiveDiscount = useMemo(() => {
    if (discountMode === "percent") {
      return Math.min(subtotal, (subtotal * discountPercent) / 100)
    }
    return Math.min(subtotal, Math.max(0, discount))
  }, [discountMode, discount, discountPercent, subtotal])

  const total = useMemo(() => Math.max(0, subtotal - effectiveDiscount), [subtotal, effectiveDiscount])

  const paidSum = useMemo(
    () => payments.reduce((s, p) => s + (p.amount - p.discount), 0),
    [payments],
  )
  const remaining = useMemo(() => Math.max(0, total - paidSum), [total, paidSum])

  // --- Options ---------------------------------------------------------

  const procedureOptions: SelectOption[] = useMemo(
    () =>
      procedures.map((p) => ({
        value: p.id,
        label: `${p.name} — R$ ${p.price.toFixed(2)}`,
      })),
    [procedures],
  )

  const patientOptions: SelectOption[] = useMemo(
    () =>
      patients.map((p) => {
        const phone = formatPhone(p.phone)
        return {
          value: p.id,
          label: phone ? `${p.name} — ${phone}` : p.name,
        }
      }),
    [patients],
  )

  // --- Item handlers ---------------------------------------------------

  const handleAddProcedure = () => {
    if (!pickerProcedureId) return
    const proc = procedures.find((p) => p.id === pickerProcedureId)
    if (!proc) return
    if (items.some((i) => i.procedure_id === proc.id)) {
      showToast.warning("Esse procedimento já foi adicionado.")
      return
    }
    setItems((rows) => [
      ...rows,
      {
        id: newRowID(),
        procedure_id: proc.id,
        procedure_name: proc.name,
        unit_price: proc.price,
        quantity: 1,
      },
    ])
    setPickerProcedureId("")
  }

  const removeItem = (id: string) => setItems((rows) => rows.filter((r) => r.id !== id))

  const updateItem = (id: string, patch: Partial<ItemRow>) =>
    setItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  // --- Payment handlers ------------------------------------------------

  const openAddPayment = () => {
    setEditingPayment(null)
    setPaymentDialogOpen(true)
  }
  const openEditPayment = (row: PaymentRow) => {
    setEditingPayment(row)
    setPaymentDialogOpen(true)
  }
  const handleSavePayment = (row: PaymentRow) => {
    setPayments((rows) => {
      const idx = rows.findIndex((r) => r.id === row.id)
      if (idx === -1) return [...rows, row]
      const next = [...rows]
      next[idx] = row
      return next
    })
  }
  const removePayment = (id: string) =>
    setPayments((rows) => rows.filter((r) => r.id !== id))

  // --- Patient creatable ------------------------------------------------

  const handleCreatePatientOption = (input: string) => {
    setQuickPatientName(input.trim())
    setQuickPatientOpen(true)
  }

  const handlePatientCreated = (patient: Patient) => {
    setSelectedPatient(patient)
    setPatients((arr) => (arr.some((p) => p.id === patient.id) ? arr : [...arr, patient]))
  }

  // --- Submit ----------------------------------------------------------

  const buildPaymentsPayload = (): CreateSalesPackagePaymentInput[] =>
    payments.map((p) => {
      const method = paymentMethods.find((m) => m.id === p.payment_method_id)
      // due_date is calculated from sale_date + the method's settlement days,
      // so the user doesn't have to think about it.
      const dueDate = addDaysISO(saleDate || todayStr(), method?.settlement_days || 0)
      return {
        payment_method_id: p.payment_method_id,
        amount: p.amount,
        discount: p.discount || undefined,
        installments: p.installments > 1 ? p.installments : undefined,
        due_date: dueDate,
        paid_at: p.paid_at || undefined,
      }
    })

  const validate = (): string | null => {
    if (!selectedPatient) return "Selecione um cliente."
    if (items.length === 0) return "Adicione ao menos um procedimento."
    for (const it of items) {
      if (typeof it.quantity !== "number" || it.quantity < 1) {
        return "Informe a quantidade de sessões em todos os itens."
      }
      if (it.unit_price < 0) return "Preço unitário não pode ser negativo."
    }
    if (effectiveDiscount > subtotal) return "Desconto maior que o subtotal."
    if (mode === "sale") {
      const sum = payments.reduce((s, p) => s + (p.amount - p.discount), 0)
      if (sum - total > 0.01) {
        return `Soma dos pagamentos (R$ ${sum.toFixed(2)}) é maior que o total da venda (R$ ${total.toFixed(2)}).`
      }
      // sum < total is fine: the unpaid remainder is recorded as a receivable
      // automatically by the backend.
    }
    return null
  }

  const handleSubmit = useCallback(async () => {
    const err = validate()
    if (err) {
      showToast.error(err)
      return
    }
    setSubmitting(true)
    try {
      if (isConvertingQuote && existing) {
        await api.convertSalesPackageQuote(existing.id, buildPaymentsPayload())
        showToast.success("Orçamento convertido em venda")
      } else if (existing) {
        await api.updateSalesPackage(existing.id, {
          sale_date: showSaleDate ? saleDate : undefined,
          valid_until: validUntil || undefined,
          discount: effectiveDiscount,
          notes,
        })
        showToast.success("Venda atualizada")
      } else {
        await api.createSalesPackage({
          patient_id: selectedPatient!.id,
          status: mode === "sale" ? "active" : "quote",
          sale_date: showSaleDate ? saleDate : undefined,
          valid_until: validUntil || undefined,
          discount: effectiveDiscount,
          notes,
          items: items.map((it) => ({
            procedure_id: it.procedure_id,
            unit_price: it.unit_price,
            quantity: typeof it.quantity === "number" ? it.quantity : 0,
          })),
          payments: mode === "sale" ? buildPaymentsPayload() : undefined,
        })
        showToast.success(mode === "sale" ? "Venda registrada" : "Orçamento criado")
      }
      onSuccess()
    } catch (e) {
      handleApiError(e)
    } finally {
      setSubmitting(false)
    }
  }, [existing, mode, items, payments, selectedPatient, saleDate, validUntil, effectiveDiscount, notes, total, subtotal, showSaleDate, isConvertingQuote])

  // --- Render ----------------------------------------------------------

  const title = isConvertingQuote
    ? `Converter orçamento ${existing!.code} em venda`
    : existing
      ? `Venda ${existing.code}`
      : mode === "sale"
        ? "Nova Venda"
        : "Novo Orçamento"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>{title}</DialogTitle>
            {existing && (
              <SalesPackageWhatsAppButton
                pkg={existing}
                size="sm"
                variant="outline"
                iconOnly={false}
                label={existing.status === "quote" ? "Enviar orçamento" : "Enviar recibo"}
                className="mr-6"
              />
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Patient */}
          <div>
            <Label>Cliente</Label>
            {existing ? (
              <Input
                value={
                  selectedPatient
                    ? `${selectedPatient.name}${selectedPatient.phone ? ` — ${formatPhone(selectedPatient.phone)}` : ""}`
                    : existing.patient_name || existing.patient_id
                }
                disabled
              />
            ) : (
              <ReactCreatableSelect
                value={
                  selectedPatient
                    ? {
                        value: selectedPatient.id,
                        label: selectedPatient.phone
                          ? `${selectedPatient.name} — ${formatPhone(selectedPatient.phone)}`
                          : selectedPatient.name,
                      }
                    : null
                }
                onChange={(opt) => {
                  if (!opt) {
                    setSelectedPatient(null)
                    return
                  }
                  const p = patients.find((x) => x.id === (opt as SelectOption).value) || null
                  setSelectedPatient(p)
                }}
                onCreateOption={handleCreatePatientOption}
                onInputChange={(v) => setPatientQuery(v)}
                options={patientOptions}
                placeholder="Buscar paciente..."
                isClearable
              />
            )}
          </div>

          {/* Sale date + validity */}
          <div className="grid grid-cols-2 gap-3">
            {showSaleDate && (
              <div>
                <Label>Data da venda</Label>
                <Input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  disabled={isReadonly}
                />
              </div>
            )}
            <div>
              <Label>Validade do pacote (opcional)</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                disabled={isReadonly}
              />
            </div>
          </div>

          {/* Procedures: search/picker + list of added items */}
          <div>
            <Label>Procedimentos</Label>
            {!existing && (
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1">
                  <ReactSelect
                    value={
                      pickerProcedureId
                        ? procedureOptions.find((o) => o.value === pickerProcedureId) || null
                        : null
                    }
                    onChange={(opt) => setPickerProcedureId(opt?.value || "")}
                    options={procedureOptions}
                    placeholder="Pesquisar procedimento..."
                    isClearable
                  />
                </div>
                <Button type="button" onClick={handleAddProcedure} disabled={!pickerProcedureId}>
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            )}

            <div className="mt-2 space-y-2">
              {items.length === 0 && (
                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  Nenhum procedimento adicionado.
                </div>
              )}
              {items.map((row) => {
                const lineQty = typeof row.quantity === "number" ? row.quantity : 0
                const lineTotal = row.unit_price * lineQty
                return (
                  <div key={row.id} className="grid grid-cols-12 items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                    <div className="col-span-5 font-medium text-sm">{row.procedure_name}</div>
                    <div className="col-span-3">
                      <Label className="text-xs">Preço unitário</Label>
                      <CurrencyInput
                        value={row.unit_price}
                        onChange={(v: number) => updateItem(row.id, { unit_price: v })}
                        disabled={!!existing}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Qtd. sessões</Label>
                      <Input
                        type="number"
                        min={1}
                        value={row.quantity === "" ? "" : row.quantity}
                        onChange={(e) => {
                          const v = e.target.value
                          updateItem(row.id, {
                            quantity: v === "" ? "" : Math.max(0, parseInt(v, 10) || 0),
                          })
                        }}
                        disabled={!!existing}
                      />
                    </div>
                    <div className="col-span-1 text-right text-sm text-muted-foreground">
                      R$ {lineTotal.toFixed(2)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {!existing && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(row.id)}
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-3 gap-3 rounded-md border p-3">
            <div>
              <Label>Subtotal</Label>
              <div className="text-lg font-medium">R$ {subtotal.toFixed(2)}</div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Desconto</Label>
                <div className="flex rounded-md border bg-muted/40 p-0.5">
                  <button
                    type="button"
                    onClick={() => setDiscountMode("amount")}
                    className={cn(
                      "rounded px-2 py-0.5 text-xs",
                      discountMode === "amount"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground",
                    )}
                    disabled={isReadonly}
                    title="Desconto em reais"
                  >
                    <DollarSign className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountMode("percent")}
                    className={cn(
                      "rounded px-2 py-0.5 text-xs",
                      discountMode === "percent"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground",
                    )}
                    disabled={isReadonly}
                    title="Desconto em porcentagem"
                  >
                    <Percent className="h-3 w-3" />
                  </button>
                </div>
              </div>
              {discountMode === "amount" ? (
                <CurrencyInput
                  value={discount}
                  onChange={(v: number) => setDiscount(v)}
                  disabled={isReadonly}
                />
              ) : (
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={discountPercent}
                    onChange={(e) =>
                      setDiscountPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))
                    }
                    disabled={isReadonly}
                  />
                  <Percent className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                </div>
              )}
              {discountMode === "percent" && effectiveDiscount > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  R$ {effectiveDiscount.toFixed(2)}
                </p>
              )}
            </div>
            <div>
              <Label>Total</Label>
              <div className="text-lg font-bold">R$ {total.toFixed(2)}</div>
            </div>
          </div>

          {/* Payments */}
          {showPayments && (
            <div>
              <div className="flex items-center justify-between">
                <Label>Formas de pagamento</Label>
                {!isReadonly && (
                  <Button type="button" size="sm" variant="outline" onClick={openAddPayment}>
                    <Plus className="mr-1 h-3 w-3" />
                    Adicionar
                  </Button>
                )}
              </div>
              <div className="mt-2 space-y-2">
                {payments.length === 0 ? (
                  <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    Nenhum pagamento adicionado. O total de R$ {total.toFixed(2)}{" "}
                    será registrado automaticamente como conta a receber.
                  </div>
                ) : (
                  payments.map((row) => {
                    const method = paymentMethods.find((m) => m.id === row.payment_method_id)
                    return (
                      <div
                        key={row.id}
                        className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="font-medium">{method?.name || "—"}</span>
                          <span>R$ {(row.amount - row.discount).toFixed(2)}</span>
                          {row.discount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Desc. R$ {row.discount.toFixed(2)}
                            </Badge>
                          )}
                          {row.installments > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              {row.installments}x
                            </Badge>
                          )}
                          {row.paid_at ? (
                            <Badge className="text-xs">
                              Pago em {format(new Date(`${row.paid_at}T00:00:00`), "dd/MM/yyyy")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">A receber</Badge>
                          )}
                        </div>
                        {!isReadonly && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditPayment(row)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removePayment(row.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
                {payments.length > 0 && (
                  <div className="text-right text-xs text-muted-foreground">
                    Soma: R$ {paidSum.toFixed(2)} / Total: R$ {total.toFixed(2)}
                    {paidSum - total > 0.01 ? (
                      <span className="ml-1 font-medium text-destructive">
                        (excesso R$ {(paidSum - total).toFixed(2)})
                      </span>
                    ) : remaining > 0.01 ? (
                      <span className="ml-1 text-foreground">
                        (R$ {remaining.toFixed(2)} a receber)
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {isConvertingQuote
              ? "Converter em venda"
              : existing
                ? "Salvar"
                : mode === "sale"
                  ? "Registrar venda"
                  : "Salvar orçamento"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <PaymentEditDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        initial={editingPayment}
        remaining={editingPayment ? editingPayment.amount : remaining}
        paymentMethods={paymentMethods}
        onSave={handleSavePayment}
      />

      <QuickPatientDialog
        open={quickPatientOpen}
        onOpenChange={setQuickPatientOpen}
        initialName={quickPatientName}
        onCreated={handlePatientCreated}
      />
    </Dialog>
  )
}
