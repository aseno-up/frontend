"use client"

import { useEffect, useState } from "react"

import { api } from "@/lib/api/client"
import { handleApiError, showToast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DeleteAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string | null
  onSuccess: () => void
}

interface Preview {
  procedures_count: number
  payments_count: number
  payments_total: number
}

export function DeleteAppointmentDialog({ open, onOpenChange, appointmentId, onSuccess }: DeleteAppointmentDialogProps) {
  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!open || !appointmentId) {
      setPreview(null)
      return
    }
    let cancelled = false
    setPreviewLoading(true)
    api
      .getAppointmentDeletePreview(appointmentId)
      .then((data) => {
        if (!cancelled) setPreview(data)
      })
      .catch((err) => {
        if (!cancelled) handleApiError(err, "Erro ao carregar informações do agendamento")
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, appointmentId])

  const handleDelete = async (deletePayments: boolean) => {
    if (!appointmentId) return
    setIsDeleting(true)
    try {
      await api.deleteAppointment(appointmentId, { deletePayments })
      showToast.success(deletePayments
        ? "Agendamento e pagamentos excluídos com sucesso."
        : "Agendamento excluído com sucesso.")
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      handleApiError(err, "Erro ao excluir agendamento")
    } finally {
      setIsDeleting(false)
    }
  }

  const hasPayments = (preview?.payments_count ?? 0) > 0
  const busy = isDeleting || previewLoading

  return (
    <Dialog open={open} onOpenChange={!busy ? onOpenChange : undefined}>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Excluir agendamento</DialogTitle>
          <DialogDescription>
            {previewLoading && "Verificando registros vinculados…"}
            {!previewLoading && !hasPayments &&
              "Esta ação não pode ser desfeita."}
            {!previewLoading && hasPayments && (
              <>
                Este agendamento possui{" "}
                <strong>
                  {preview!.payments_count} pagamento{preview!.payments_count > 1 ? "s" : ""}
                </strong>{" "}
                registrado{preview!.payments_count > 1 ? "s" : ""} no valor total de{" "}
                <strong>
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(preview!.payments_total)}
                </strong>
                . Escolha o que fazer com os pagamentos:
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => handleDelete(true)} disabled={busy} className="w-full sm:w-auto">
            {isDeleting ? "Aguarde…" : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
