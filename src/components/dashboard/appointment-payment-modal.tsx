"use client"

import { useCallback, useEffect, useState } from "react"
import { format } from "date-fns"
import { Loader2, Trash2, Plus, Pencil, X, Share2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CurrencyInput } from "@/components/ui/currency-input"
import { ShareReceiptDialog } from "./share-receipt-dialog"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import type { AppointmentPayment, PaymentMethod, PatientInfo } from "@/types/api"

interface AppointmentPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  appointmentId: string
  appointmentPrice: number
  patient?: Pick<PatientInfo, "name" | "phone" | "whatsapp"> | null
  appointmentStartTime?: string
  professionalName?: string
  onPaymentChanged?: () => void
}

export function AppointmentPaymentModal({
  isOpen,
  onClose,
  appointmentId,
  appointmentPrice,
  patient,
  appointmentStartTime,
  professionalName,
  onPaymentChanged,
}: AppointmentPaymentModalProps) {
  const [payments, setPayments] = useState<AppointmentPayment[]>([])
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  // Form state
  const [amount, setAmount] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [installments, setInstallments] = useState(1)
  const [selectedMethodId, setSelectedMethodId] = useState("")
  const [notes, setNotes] = useState("")
  const [hasInitializedAmount, setHasInitializedAmount] = useState(false)

  // Edit state
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)

  const selectedMethod = methods.find((m) => m.id === selectedMethodId)
  // Convert to cents (integers), calculate, convert back — avoids float precision issues
  const toCents = (v: number) => Math.round(v * 100)
  const fromCents = (v: number) => v / 100

  // amount + discount = how much of the session price is covered
  const totalCoveredCents = payments.reduce((sum, p) => sum + toCents(p.amount) + toCents(p.discount), 0)
  const totalPaidCents = payments.reduce((sum, p) => sum + toCents(p.amount), 0)
  const totalPaid = fromCents(totalPaidCents)
  const totalCovered = fromCents(totalCoveredCents)
  const remaining = fromCents(Math.max(0, toCents(appointmentPrice) - totalCoveredCents))

  // Full reload (payments + methods) happens only when the dialog opens.
  const loadInitial = useCallback(async () => {
    if (!appointmentId) return
    try {
      setIsLoading(true)
      const [paymentsRes, methodsRes] = await Promise.all([
        api.getAppointmentPayments(appointmentId),
        api.getActivePaymentMethods(),
      ])
      setPayments(paymentsRes.data || [])
      setMethods(methodsRes.data || [])
    } catch (err) {
      handleApiError(err, "Erro ao carregar pagamentos")
    } finally {
      setIsLoading(false)
    }
  }, [appointmentId])

  // After a save or delete we only need the updated payment list — payment
  // methods don't change during the session, so skipping that call keeps the
  // round-trip short.
  const reloadPayments = useCallback(async () => {
    if (!appointmentId) return
    try {
      const paymentsRes = await api.getAppointmentPayments(appointmentId)
      setPayments(paymentsRes.data || [])
    } catch (err) {
      handleApiError(err, "Erro ao carregar pagamentos")
    }
  }, [appointmentId])

  const resetForm = () => {
    setAmount(0)
    setDiscount(0)
    setInstallments(1)
    setNotes("")
    setEditingPaymentId(null)
  }

  useEffect(() => {
    if (isOpen) {
      loadInitial()
      resetForm()
      setSelectedMethodId("")
      setHasInitializedAmount(false)
    }
  }, [isOpen, loadInitial])

  useEffect(() => {
    if (methods.length > 0 && !selectedMethodId) {
      setSelectedMethodId(methods[0].id)
    }
  }, [methods, selectedMethodId])

  useEffect(() => {
    if (!hasInitializedAmount && remaining > 0 && !isLoading && !editingPaymentId) {
      setAmount(remaining)
      setHasInitializedAmount(true)
    }
  }, [remaining, hasInitializedAmount, isLoading, editingPaymentId])

  const handleStartEdit = (payment: AppointmentPayment) => {
    setEditingPaymentId(payment.id)
    setAmount(payment.amount)
    setDiscount(payment.discount)
    setInstallments(payment.installments || 1)
    setSelectedMethodId(payment.payment_method_id)
    setNotes(payment.notes || "")
  }

  const handleCancelEdit = () => {
    resetForm()
    setHasInitializedAmount(false)
  }

  const handleSave = async () => {
    if (!selectedMethodId || amount <= 0) return
    try {
      setIsSaving(true)
      const data = {
        payment_method_id: selectedMethodId,
        amount,
        discount: discount || 0,
        installments: installments || 1,
        notes,
      }

      if (editingPaymentId) {
        await api.updateAppointmentPayment(appointmentId, editingPaymentId, data)
        showToast.success("Pagamento atualizado!")
      } else {
        await api.createAppointmentPayment(appointmentId, data)
        showToast.success("Pagamento registrado!")
      }

      resetForm()
      setHasInitializedAmount(false)
      await reloadPayments()
      onPaymentChanged?.()
    } catch (err) {
      handleApiError(err, editingPaymentId ? "Erro ao atualizar pagamento" : "Erro ao registrar pagamento")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (paymentId: string) => {
    try {
      await api.deleteAppointmentPayment(appointmentId, paymentId)
      showToast.success("Pagamento removido!")
      if (editingPaymentId === paymentId) {
        resetForm()
      }
      await reloadPayments()
      onPaymentChanged?.()
    } catch (err) {
      handleApiError(err, "Erro ao remover pagamento")
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm")
    } catch {
      return "—"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-10">
            <DialogTitle>Pagamentos</DialogTitle>
            {payments.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShareOpen(true)}
              >
                <Share2 className="h-4 w-4 mr-2" /> Compartilhar recibo
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border shrink-0">
          <div className="text-sm">
            <span className="text-muted-foreground">Valor:</span>{" "}
            <span className="font-medium">{formatCurrency(appointmentPrice)}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Pago:</span>{" "}
            <span className={`font-medium ${totalCovered >= appointmentPrice ? "text-green-600" : totalPaid > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
              {formatCurrency(totalPaid)}
            </span>
            {totalCovered > totalPaid && (
              <span className="text-xs text-muted-foreground ml-1">(+{formatCurrency(fromCents(totalCoveredCents - totalPaidCents))} desc.)</span>
            )}
          </div>
          {remaining > 0 && (
            <Badge variant="outline" className="text-xs">
              Falta {formatCurrency(remaining)}
            </Badge>
          )}
          {remaining <= 0 && totalCovered > 0 && (
            <Badge variant="success" className="text-xs">Pago</Badge>
          )}
        </div>

        {/* Existing payments list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length > 0 ? (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className={`flex items-center justify-between p-3 border rounded-lg text-sm transition-colors ${
                    editingPaymentId === payment.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {payment.payment_method?.name || "—"}
                    </Badge>
                    <span className="font-medium">{formatCurrency(payment.amount)}</span>
                    {payment.discount > 0 && (
                      <span className="text-xs text-muted-foreground">desc. {formatCurrency(payment.discount)}</span>
                    )}
                    {payment.installments > 1 && (
                      <span className="text-xs text-muted-foreground">{payment.installments}x</span>
                    )}
                    {payment.notes && (
                      <span className="text-xs text-muted-foreground truncate max-w-[100px]">{payment.notes}</span>
                    )}
                    <span className="text-xs text-muted-foreground/60 ml-auto shrink-0">
                      {formatDate(payment.paid_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`h-7 w-7 ${editingPaymentId === payment.id ? "text-primary" : ""}`}
                      onClick={() => editingPaymentId === payment.id ? handleCancelEdit() : handleStartEdit(payment)}
                    >
                      {editingPaymentId === payment.id ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(payment.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum pagamento registrado.</p>
          )}
        </div>

        {/* Payment form */}
        <div className="border-t pt-4 space-y-3 shrink-0">
          <p className="text-sm font-medium">
            {editingPaymentId ? (
              <span className="text-primary">Editando pagamento</span>
            ) : (
              "Registrar pagamento"
            )}
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Valor pago</Label>
              <CurrencyInput value={amount} onChange={setAmount} />
            </div>
            <div className="w-44 space-y-1.5">
              <Label className="text-xs">Metodo</Label>
              <Select value={selectedMethodId} onValueChange={(v) => {
                setSelectedMethodId(v)
                const m = methods.find((m) => m.id === v)
                if (m?.type !== "credit") setInstallments(1)
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="w-28 space-y-1.5">
              <Label className="text-xs">Desconto</Label>
              <CurrencyInput
                value={discount}
                onChange={(newDiscount) => {
                  // When the draft covers exactly the remaining balance
                  // (amount + current discount == remaining), re-balance so
                  // the new total still fits. Without this, the backend
                  // rejects with "valor do pagamento excede o saldo".
                  const draftCoveredCents = toCents(amount) + toCents(discount)
                  if (
                    !editingPaymentId &&
                    Math.abs(draftCoveredCents - toCents(remaining)) < 1
                  ) {
                    const newAmountCents = toCents(remaining) - toCents(newDiscount)
                    setAmount(fromCents(Math.max(0, newAmountCents)))
                  }
                  setDiscount(newDiscount)
                }}
              />
            </div>
            {selectedMethod?.type === "credit" && (
              <div className="w-20 space-y-1.5">
                <Label className="text-xs">Parcelas</Label>
                <Input type="number" min={1} max={24} value={installments} onChange={(e) => setInstallments(Math.max(1, parseInt(e.target.value) || 1))} />
              </div>
            )}
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Obs (opcional)</Label>
              <Input placeholder="Ex: parcela 1/3" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSave} disabled={isSaving || amount <= 0 || !selectedMethodId || (!editingPaymentId && remaining <= 0 && totalCovered > 0)}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : editingPaymentId ? <Pencil className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {editingPaymentId ? "Salvar alteracao" : "Registrar pagamento"}
            </Button>
            {editingPaymentId && (
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
      <ShareReceiptDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        appointmentId={appointmentId}
        patient={patient}
        startTime={appointmentStartTime}
        professionalName={professionalName}
      />
    </Dialog>
  )
}
