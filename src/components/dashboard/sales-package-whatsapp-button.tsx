"use client"

import { useState } from "react"

import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { showToast, handleApiError } from "@/lib/toast"
import { useAuthStore } from "@/stores/auth-store"
import { api } from "@/lib/api/client"
import { buildWhatsAppWebLink, sanitizePhoneForWhatsApp } from "@/lib/whatsapp-web"
import type { SalesPackage } from "@/types/api"

interface Props extends Omit<ButtonProps, "onClick" | "children"> {
  pkg: SalesPackage
  iconOnly?: boolean
  label?: string
}

// SalesPackageWhatsAppButton mirrors WhatsAppReminderButton's brand colors and
// composes a WhatsApp message that links to the public receipt page (the same
// /recibo flow used for appointments). Falls back gracefully when the patient
// has no phone, telling the user instead of opening a broken wa.me link.
export function SalesPackageWhatsAppButton({
  pkg,
  iconOnly = true,
  label = "Enviar pelo WhatsApp",
  variant = "outline",
  size = "icon",
  className,
  title,
  ...buttonProps
}: Props) {
  const clinicName = useAuthStore((state) => state.clinic?.name)
  const [loading, setLoading] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()

    const phone = sanitizePhoneForWhatsApp(pkg.patient_phone)
    if (!phone) {
      showToast.error("Cliente sem telefone cadastrado.")
      return
    }

    setLoading(true)
    let publicURL = ""
    try {
      const resp = await api.ensureSalesPackageReceiptToken(pkg.id)
      publicURL = resp.public_url
    } catch (err) {
      handleApiError(err)
      return
    } finally {
      setLoading(false)
    }

    const isQuote = pkg.status === "quote"
    const intro = isQuote
      ? `Olá! Segue o orçamento ${pkg.code}`
      : `Olá! Segue o recibo da sua compra ${pkg.code}`

    const lines = [
      intro,
      ...(clinicName ? [`(${clinicName})`] : []),
      "",
      `Total: R$ ${pkg.total.toFixed(2)}`,
      "",
      "Detalhes completos:",
      publicURL,
    ]

    const url = buildWhatsAppWebLink(phone, lines.join("\n"))
    window.open(url, "_blank", "noopener")
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={loading}
      title={title ?? label}
      className={cn(
        "text-[#25D366] border-[#25D366]/40 hover:bg-[#25D366]/10 hover:text-[#128C7E] hover:border-[#25D366]",
        className,
      )}
      {...buttonProps}
    >
      <WhatsAppIcon className={cn("h-4 w-4", !iconOnly && "mr-2")} />
      {!iconOnly && label}
    </Button>
  )
}
