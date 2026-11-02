const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4901/api/v1"

export interface ClinicInfo {
  name: string
  slug: string
  logo_url: string
  primary_color: string
  phone: string
  address: string
  city: string
  state: string
  default_appointment_minutes: number
  about_us: string
  professional_count: number
  specialty_count: number
  require_payment_before_booking: boolean
}

export interface Professional {
  id: string
  name: string
  specialty_ids: string[]
  specialty_names: string[]
  avatar_url: string
  bio: string
  color: string
  has_available_schedule: boolean
  working_hours: Record<string, { start: string; end: string }[]>
}

export interface Specialty {
  id: string
  name: string
}

export interface Procedure {
  id: string
  name: string
  specialty_id: string | null
  price: number
  duration_minutes: number
}

export interface AvailableSlot {
  start_time: string
  end_time: string
}

export interface AvailableSlotsResponse {
  date: string
  professional_id: string
  duration_minutes: number
  slots: AvailableSlot[]
}

export interface BookingResponse {
  id: string
  clinic_id: string
  professional: string
  start_time: string
  end_time: string
  status: string
  price: number
  payment_token?: string
  payment_url?: string
  message: string
}

export async function fetchClinicInfo(slug: string): Promise<ClinicInfo> {
  const res = await fetch(`${API_URL}/book/${slug}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error("Clínica não encontrada")
    throw new Error("Erro ao carregar dados da clínica")
  }
  return res.json()
}

export async function fetchProfessionals(slug: string): Promise<Professional[]> {
  const res = await fetch(`${API_URL}/book/${slug}/professionals`)
  if (!res.ok) throw new Error("Erro ao carregar profissionais")
  const data = await res.json()
  return data || []
}

export async function fetchSpecialties(slug: string): Promise<Specialty[]> {
  const res = await fetch(`${API_URL}/book/${slug}/specialties`)
  if (!res.ok) throw new Error("Erro ao carregar especialidades")
  const data = await res.json()
  return data || []
}

export async function fetchProcedures(slug: string, specialtyId?: string, professionalId?: string): Promise<Procedure[]> {
  const searchParams = new URLSearchParams()
  if (specialtyId) searchParams.set("specialty_id", specialtyId)
  if (professionalId) searchParams.set("professional_id", professionalId)
  const qs = searchParams.toString() ? `?${searchParams.toString()}` : ""
  const res = await fetch(`${API_URL}/book/${slug}/procedures${qs}`)
  if (!res.ok) throw new Error("Erro ao carregar procedimentos")
  const data = await res.json()
  return data || []
}

export async function fetchSlots(
  slug: string,
  professionalId: string,
  date: string,
  procedureId?: string
): Promise<AvailableSlotsResponse> {
  let url = `${API_URL}/book/${slug}/slots?professional_id=${professionalId}&date=${date}`
  if (procedureId) url += `&procedure_id=${procedureId}`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Erro ao carregar horários")
  return res.json()
}

export async function createBooking(
  slug: string,
  data: {
    professional_id: string
    start_time: string
    procedure_id?: string
    patient_name: string
    patient_phone: string
    patient_email?: string
    patient_notes?: string
  }
): Promise<BookingResponse> {
  const res = await fetch(`${API_URL}/book/${slug}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error?.message || "Erro ao agendar")
  }
  return res.json()
}
