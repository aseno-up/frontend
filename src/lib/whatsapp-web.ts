import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Appointment, PatientInfo } from "@/types/api"

export function sanitizePhoneForWhatsApp(raw?: string | null): string {
  if (!raw) return ""
  const digits = raw.replace(/\D/g, "")
  if (!digits) return ""
  // Keep the number unchanged if it already includes a country code (12+ digits).
  // Assume Brazil (55) when only the local 10-11 digit number is stored.
  if (digits.length >= 12) return digits
  return `55${digits}`
}

export function pickWhatsAppPhone(patient?: Pick<PatientInfo, "whatsapp" | "phone"> | null): string {
  if (!patient) return ""
  return sanitizePhoneForWhatsApp(patient.whatsapp || patient.phone)
}

export function buildWhatsAppWebLink(phone: string, message: string): string {
  const sanitized = sanitizePhoneForWhatsApp(phone)
  const text = encodeURIComponent(message)
  return `https://wa.me/${sanitized}?text=${text}`
}

interface ReminderMessageParams {
  patientName: string
  startTime: string | Date
  professionalName?: string
  clinicName?: string
}

export function buildAppointmentReminderMessage({
  patientName,
  startTime,
  professionalName,
  clinicName,
}: ReminderMessageParams): string {
  const date = typeof startTime === "string" ? new Date(startTime) : startTime
  const dateText = format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
  const timeText = format(date, "HH:mm")
  const firstName = patientName.split(" ")[0] || patientName
  const greeting = `Olá, ${firstName}!`
  const intro = clinicName
    ? `Aqui é da ${clinicName}, passando para confirmar sua consulta`
    : "Passando para confirmar sua consulta"
  const withPro = professionalName ? ` com ${professionalName}` : ""
  return [
    greeting,
    "",
    `${intro}${withPro} na ${dateText} às ${timeText}.`,
    "",
    "Você confirma sua presença? Qualquer imprevisto, é só nos avisar por aqui.",
    "",
    "Obrigado!",
  ].join("\n")
}

export function openWhatsAppReminder(params: {
  phone: string
  message: string
}): void {
  const url = buildWhatsAppWebLink(params.phone, params.message)
  window.open(url, "_blank")
}

export function buildAppointmentReminderLink(
  appointment: Pick<Appointment, "patient" | "professional" | "start_time">,
  clinicName?: string,
): { url: string; hasPhone: boolean } {
  const phone = pickWhatsAppPhone(appointment.patient)
  const message = buildAppointmentReminderMessage({
    patientName: appointment.patient?.name || "",
    startTime: appointment.start_time,
    professionalName: appointment.professional?.name,
    clinicName,
  })
  return {
    url: buildWhatsAppWebLink(phone, message),
    hasPhone: phone.length > 0,
  }
}
