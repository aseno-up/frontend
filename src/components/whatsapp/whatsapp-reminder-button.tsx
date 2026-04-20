"use client"

import { WhatsAppIcon } from "./whatsapp-icon"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { showToast } from "@/lib/toast"
import { useAuthStore } from "@/stores/auth-store"
import {
  buildAppointmentReminderLink,
  buildAppointmentReminderMessage,
  buildWhatsAppWebLink,
  pickWhatsAppPhone,
} from "@/lib/whatsapp-web"
import type { Appointment, PatientInfo } from "@/types/api"

interface BaseProps extends Omit<ButtonProps, "onClick" | "children"> {
  label?: string
  iconOnly?: boolean
  title?: string
}

interface AppointmentProps extends BaseProps {
  appointment: Pick<Appointment, "patient" | "professional" | "start_time">
  patient?: never
  startTime?: never
  professionalName?: never
}

interface ManualProps extends BaseProps {
  appointment?: never
  patient: Pick<PatientInfo, "name" | "phone" | "whatsapp">
  startTime: string | Date
  professionalName?: string
}

type Props = AppointmentProps | ManualProps

export function WhatsAppReminderButton(props: Props) {
  const {
    label = "Enviar lembrete",
    iconOnly = false,
    variant = "outline",
    size = "sm",
    className,
    title,
    ...buttonProps
  } = props

  const clinicName = useAuthStore((state) => state.clinic?.name)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    let url = ""
    let hasPhone = false

    if ("appointment" in props && props.appointment) {
      const result = buildAppointmentReminderLink(props.appointment, clinicName)
      url = result.url
      hasPhone = result.hasPhone
    } else if ("patient" in props && props.patient) {
      const phone = pickWhatsAppPhone(props.patient)
      hasPhone = phone.length > 0
      const message = buildAppointmentReminderMessage({
        patientName: props.patient.name,
        startTime: props.startTime,
        professionalName: props.professionalName,
        clinicName,
      })
      url = buildWhatsAppWebLink(phone, message)
    }

    if (!hasPhone) {
      showToast.error("Paciente sem telefone/WhatsApp cadastrado")
      return
    }

    window.open(url, "_blank", "noopener")
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      title={title ?? "Abrir WhatsApp Web com mensagem de confirmacao"}
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
