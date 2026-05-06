"use client"

import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { showToast } from "@/lib/toast"
import { useAuthStore } from "@/stores/auth-store"
import { buildWhatsAppWebLink, sanitizePhoneForWhatsApp } from "@/lib/whatsapp-web"
import type { SalesPackage } from "@/types/api"

interface Props extends Omit<ButtonProps, "onClick" | "children"> {
  pkg: SalesPackage
  iconOnly?: boolean
  label?: string
}

// SalesPackageWhatsAppButton mirrors WhatsAppReminderButton's look (green
// branding) but builds the message from a sales package (orçamento or recibo).
// Falls back gracefully when the patient has no phone, telling the user
// instead of opening a broken wa.me link.
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    const phone = sanitizePhoneForWhatsApp(pkg.patient_phone)
    if (!phone) {
      showToast.error("Cliente sem telefone cadastrado.")
      return
    }

    const intro =
      pkg.status === "quote"
        ? `Olá! Segue o orçamento ${pkg.code}`
        : `Olá! Segue o recibo da sua compra ${pkg.code}`
    const itemsLines = (pkg.items || []).map((it) => {
      const name = it.procedure?.name || "Procedimento"
      return `• ${name} — ${it.quantity}x R$ ${it.unit_price.toFixed(2)}`
    })
    const lines: string[] = [intro]
    if (clinicName) lines.push(`(${clinicName})`)
    lines.push("")
    lines.push(...itemsLines)
    if (pkg.discount > 0) lines.push(`Desconto: R$ ${pkg.discount.toFixed(2)}`)
    lines.push(`Total: R$ ${pkg.total.toFixed(2)}`)
    lines.push("")
    lines.push("Qualquer dúvida estou à disposição. Obrigado!")

    const url = buildWhatsAppWebLink(phone, lines.join("\n"))
    window.open(url, "_blank", "noopener")
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
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
