"use client"

import { useCallback, useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Copy, ExternalLink, Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon"
import { api } from "@/lib/api/client"
import { showToast, handleApiError } from "@/lib/toast"
import { buildWhatsAppWebLink, pickWhatsAppPhone } from "@/lib/whatsapp-web"
import type { PatientInfo } from "@/types/api"

function buildWhatsAppMessage(
  patientName: string,
  url: string,
  startTime?: string | Date,
  professionalName?: string,
): string {
  const firstName = patientName.split(" ")[0] || patientName
  const lines = [`Olá ${firstName}! Segue o recibo do seu atendimento`]
  if (startTime) {
    const date = typeof startTime === "string" ? new Date(startTime) : startTime
    const dateText = format(date, "dd 'de' MMMM", { locale: ptBR })
    const timeText = format(date, "HH:mm")
    const withPro = professionalName ? ` com ${professionalName}` : ""
    lines.push(`do dia ${dateText} às ${timeText}${withPro}.`)
  } else {
    lines[0] += "."
  }
  lines.push("", url)
  return lines.join("\n")
}

interface ShareReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
  // Optional: lets the WhatsApp button light up without a second fetch.
  patient?: Pick<PatientInfo, "name" | "phone" | "whatsapp"> | null
  // Used to enrich the WhatsApp message with the appointment date/time.
  startTime?: string | Date
  professionalName?: string
}

export function ShareReceiptDialog({
  open,
  onOpenChange,
  appointmentId,
  patient,
  startTime,
  professionalName,
}: ShareReceiptDialogProps) {
  const [publicUrl, setPublicUrl] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const loadToken = useCallback(async () => {
    if (!appointmentId) return
    setLoading(true)
    try {
      const { public_url } = await api.ensureAppointmentReceiptToken(appointmentId)
      setPublicUrl(public_url)
    } catch (err) {
      handleApiError(err, "Erro ao gerar link do recibo")
    } finally {
      setLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    if (open) loadToken()
  }, [open, loadToken])

  const phone = pickWhatsAppPhone(patient ?? undefined)
  const whatsAppLink = phone && publicUrl && patient?.name
    ? buildWhatsAppWebLink(phone, buildWhatsAppMessage(patient.name, publicUrl, startTime, professionalName))
    : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar recibo</DialogTitle>
          <DialogDescription>
            Link público do recibo. O conteúdo reflete o estado atual dos pagamentos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center gap-2">
            <Input value={publicUrl} readOnly placeholder={loading ? "Gerando link..." : ""} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!publicUrl}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(publicUrl)
                  showToast.success("Link copiado!")
                } catch {
                  showToast.error("Não foi possível copiar o link")
                }
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!publicUrl}
              onClick={() => window.open(publicUrl, "_blank", "noopener")}
            >
              <ExternalLink className="h-4 w-4 mr-2" /> Abrir recibo
            </Button>
            {whatsAppLink && (
              <Button
                type="button"
                size="sm"
                className="bg-[#25D366] text-white hover:bg-[#128C7E]"
                onClick={() => window.open(whatsAppLink, "_blank", "noopener")}
              >
                <WhatsAppIcon className="h-4 w-4 mr-2" /> Enviar por WhatsApp
              </Button>
            )}
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Gerando link...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
