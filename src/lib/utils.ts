import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// dateInputToISO converts a `<input type="date">` value (e.g. "2026-05-06")
// to a full RFC3339 timestamp the Go backend can unmarshal natively. Returns
// undefined for empty input so callers can omit the field entirely.
//
// Without this helper, sending bare "yyyy-MM-dd" to a `*time.Time` field
// trips the JSON unmarshaler ("parsing time ... as RFC3339") and the request
// fails with a 400. UTC midnight is intentional: the backend stores dates
// (no time-of-day) and we don't want timezone drift to bump the day.
export function dateInputToISO(value?: string | null): string | undefined {
  if (!value) return undefined
  const trimmed = String(value).trim()
  if (!trimmed) return undefined
  if (trimmed.includes("T")) return trimmed
  return `${trimmed}T00:00:00Z`
}

// formatPhone returns a human-readable phone string from any digits-only or
// pre-formatted input. Mirrors the visual mask the user expects on UI lists:
//   13 digits → "XX (XX) X XXXX-XXXX"  (DDI + DDD + mobile)
//   12 digits → "XX (XX) XXXX-XXXX"    (DDI + DDD + landline)
//   11 digits → "(XX) X XXXX-XXXX"     (no DDI, BR mobile)
//   10 digits → "(XX) XXXX-XXXX"       (no DDI, BR landline)
//   < 10 digits or empty → original string (best effort)
//
// DDI is omitted from the mask when it isn't present in the source so we
// don't invent a "55" prefix that wasn't typed by the user.
export function formatPhone(phone?: string | null): string {
  if (!phone) return ""
  const digits = phone.replace(/\D/g, "")
  if (!digits) return phone
  switch (digits.length) {
    case 13:
      return `${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 5)} ${digits.slice(5, 9)}-${digits.slice(9)}`
    case 12:
      return `${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`
    case 11:
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`
    case 10:
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    default:
      return phone
  }
}
