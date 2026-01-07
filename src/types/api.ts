// API Response Types

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  avatar_url?: string
  role: 'owner' | 'admin' | 'professional' | 'receptionist'
  clinic_id: string
  is_active: boolean
  email_verified: boolean
  professional_id?: string
  last_login_at?: string
  created_at: string
}

export interface Clinic {
  id: string
  name: string
  slug: string
  subscription_status: 'trial' | 'active' | 'past_due' | 'canceled'
  plan: 'free' | 'basic' | 'professional' | 'enterprise'
  trial_ends_at: string
  created_at: string
}

export interface Professional {
  id: string
  clinic_id: string
  name: string
  email: string
  phone: string
  specialty: string
  registration_number: string
  color: string
  is_active: boolean
  working_hours: WorkingHours
  created_at: string
}

export interface WorkingHours {
  monday?: TimeSlot[]
  tuesday?: TimeSlot[]
  wednesday?: TimeSlot[]
  thursday?: TimeSlot[]
  friday?: TimeSlot[]
  saturday?: TimeSlot[]
  sunday?: TimeSlot[]
}

export interface TimeSlot {
  start: string
  end: string
}

export interface Patient {
  id: string
  clinic_id: string
  name: string
  email: string
  phone: string
  whatsapp: string
  document: string
  birth_date: string
  gender: 'male' | 'female' | 'other'
  notes: string
  created_at: string
}

export interface Appointment {
  id: string
  clinic_id: string
  patient_id: string
  professional_id: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  type: AppointmentType
  title: string
  notes: string
  patient_notes: string
  price: number
  confirmed_at?: string
  canceled_at?: string
  cancel_reason?: string
  patient?: PatientInfo
  professional?: ProfessionalInfo
  created_at: string
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'canceled'
  | 'no_show'
  | 'completed'
  | 'rescheduled'

export type AppointmentType = 'regular' | 'recurring' | 'return'

export interface PatientInfo {
  id: string
  name: string
  phone: string
  whatsapp: string
}

export interface ProfessionalInfo {
  id: string
  name: string
  specialty: string
  color: string
}

// Request Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  clinic_name: string
  name: string
  email: string
  password: string
}

export interface CreateAppointmentRequest {
  patient_id: string
  professional_id: string
  start_time: string
  duration_minutes: number
  title?: string
  notes?: string
  price?: number
  type?: AppointmentType
}

export interface UpdateAppointmentRequest {
  patient_id?: string
  professional_id?: string
  start_time?: string
  duration_minutes?: number
  status?: AppointmentStatus
  title?: string
  notes?: string
  patient_notes?: string
  price?: number
  cancel_reason?: string
}

export interface CreatePatientRequest {
  name: string
  email?: string
  phone?: string
  whatsapp?: string
  document?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
  notes?: string
}

export interface CreateProfessionalRequest {
  name: string
  email?: string
  phone?: string
  specialty?: string
  registration_number?: string
  color?: string
  working_hours?: WorkingHours
}

// Response Types
export interface AuthResponse {
  user: User
  clinic: Clinic
  access_token: string
  refresh_token: string
  expires_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface ApiError {
  error: {
    type: string
    message: string
    details?: Record<string, string>
  }
}

// WhatsApp Types
export type WhatsAppConnectionState =
  | 'open'
  | 'close'
  | 'connecting'
  | 'disconnected'

export interface WhatsAppConnectionStatus {
  state: WhatsAppConnectionState
  instance: string
  phone_connected?: string
  owner?: string
  profile_name?: string
  profile_picture_url?: string
}

export interface WhatsAppQRCode {
  qr_code: string
  base64: string
  instance: string
}

export type MessageDirection = 'inbound' | 'outbound'
export type MessageType = 'text' | 'button' | 'list' | 'template' | 'media'
export type MessageStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'

export interface WhatsAppMessage {
  id: string
  clinic_id: string
  appointment_id?: string
  phone: string
  direction: MessageDirection
  type: MessageType
  content: string
  status: MessageStatus
  error_message?: string
  external_id?: string
  sent_at?: string
  delivered_at?: string
  read_at?: string
  created_at: string
}

export interface SendMessageRequest {
  phone: string
  message: string
}

export interface SendConfirmationRequest {
  clinic_id: string
  appointment_id: string
  patient_name: string
  patient_phone: string
  professional_name: string
  appointment_time: string
  appointment_date: string
}

// Payment/Billing Types
export type BillingType = 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'UNDEFINED'
export type BillingCycle = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'

export type PaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'REFUND_IN_PROGRESS'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS'
  | 'CANCELED'

export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED'

export interface BillingCustomer {
  id: string
  clinic_id: string
  asaas_customer_id: string
  name: string
  email: string
  phone: string
  document: string
  document_type: 'CPF' | 'CNPJ'
  postal_code: string
  address: string
  address_number: string
  province: string
  city: string
  state: string
  created_at: string
}

export interface Payment {
  id: string
  clinic_id: string
  customer_id: string
  subscription_id?: string
  asaas_payment_id: string
  value: number
  net_value: number
  status: PaymentStatus
  billing_type: BillingType
  due_date: string
  payment_date?: string
  invoice_url: string
  bank_slip_url: string
  pix_qrcode_url: string
  pix_copy_paste: string
  description: string
  created_at: string
  customer?: BillingCustomer
}

export interface Subscription {
  id: string
  clinic_id: string
  customer_id: string
  asaas_subscription_id: string
  value: number
  status: SubscriptionStatus
  billing_type: BillingType
  cycle: BillingCycle
  next_due_date: string
  description: string
  end_date?: string
  max_payments?: number
  created_at: string
  customer?: BillingCustomer
}

export interface PixQRCode {
  encodedImage: string
  payload: string
  expirationDate: string
}

export interface CreateCustomerRequest {
  name: string
  email: string
  phone?: string
  document: string
  postal_code?: string
  address?: string
  address_number?: string
  province?: string
  city?: string
  state?: string
}

export interface CreatePaymentRequest {
  billing_type: BillingType
  value: number
  due_date: string
  description?: string
}

export interface CreateSubscriptionRequest {
  billing_type: BillingType
  value: number
  cycle: BillingCycle
  description?: string
}

// Google Calendar Types
export type SyncDirection = 'to_google' | 'from_google' | 'bidirectional'

export interface CalendarIntegration {
  id: string
  provider: string
  email: string
  calendar_id: string
  sync_enabled: boolean
  sync_direction: SyncDirection
  last_sync_at?: string
  last_sync_error?: string
  connected: boolean
}

export interface GoogleCalendar {
  id: string
  summary: string
  description?: string
  timeZone?: string
  primary?: boolean
}

export interface CalendarAuthURLResponse {
  auth_url: string
}

export interface CalendarCallbackResponse {
  status: string
  email: string
  message: string
}

export interface CalendarListResponse {
  calendars: GoogleCalendar[]
}

// Session Plan Types
export type PlanStatus = 'active' | 'paused' | 'completed' | 'cancelled'
export type Frequency = 'daily' | 'weekly' | 'biweekly' | 'triweekly' | 'bimonthly' | 'monthly' | 'custom'

export interface SessionPlan {
  id: string
  clinic_id: string
  patient_id: string
  professional_id?: string
  title: string
  description: string
  status: PlanStatus
  frequency: Frequency
  week_days: number[]
  preferred_time: string
  duration_mins: number
  total_sessions: number
  sessions_done: number
  start_date: string
  end_date?: string
  session_price: number
  notes: string
  paused_at?: string
  cancelled_at?: string
  completed_at?: string
  created_at: string
  patient_name?: string
  professional_name?: string
  progress: number
  remaining_sessions: number
}

export interface CreateSessionPlanRequest {
  patient_id: string
  professional_id?: string
  title: string
  description?: string
  frequency: Frequency
  week_days?: number[]
  preferred_time: string
  duration_mins: number
  total_sessions: number
  start_date: string
  session_price?: number
  notes?: string
  generate_all?: boolean
}

export interface UpdateSessionPlanRequest {
  title?: string
  description?: string
  preferred_time?: string
  duration_mins?: number
  session_price?: number
  notes?: string
}

export interface SessionPlanListResponse {
  data: SessionPlan[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Invite Types
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'canceled'
export type UserRole = 'owner' | 'admin' | 'professional' | 'receptionist'

export interface Invite {
  id: string
  clinic_id: string
  email: string
  role: UserRole
  status: InviteStatus
  expires_at: string
  created_at: string
}

export interface InviteDetails {
  id: string
  email: string
  role: UserRole
  clinic_name: string
  inviter_name: string
  expires_at: string
  is_valid: boolean
  is_expired: boolean
}

export interface CreateInviteRequest {
  email: string
  role: 'admin' | 'professional' | 'receptionist'
}

export interface AcceptInviteRequest {
  token: string
  name: string
  password: string
}

export interface InviteListResponse {
  data: Invite[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// User Management Types
export interface UserListResponse {
  data: User[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface UpdateUserRequest {
  name?: string
  phone?: string
  avatar_url?: string
  is_active?: boolean
}

export interface UpdateRoleRequest {
  role: 'admin' | 'professional' | 'receptionist'
}

// Patient Record Types (Ficha do Paciente)
export interface PatientRecord {
  id: string
  clinic_id: string
  patient_id: string
  chief_complaint: string
  medical_history: string
  family_history: string
  allergies: string
  medications: string
  surgical_history: string
  social_history: string
  initial_diagnosis: string
  treatment_plan: string
  observations: string
  created_at: string
  updated_at: string
}

export interface SessionNote {
  id: string
  clinic_id: string
  patient_id: string
  appointment_id?: string
  professional_id: string
  professional_name?: string
  session_date: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  notes: string
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface PatientBasicInfo {
  id: string
  name: string
  email: string
  phone: string
  birth_date?: string
  gender?: string
}

export interface FullPatientRecord {
  record: PatientRecord
  session_notes: SessionNote[]
  patient?: PatientBasicInfo
}

export interface CreateSessionNoteRequest {
  appointment_id?: string
  session_date: string
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
  notes?: string
  is_private?: boolean
}

export interface UpdatePatientRecordRequest {
  chief_complaint?: string
  medical_history?: string
  family_history?: string
  allergies?: string
  medications?: string
  surgical_history?: string
  social_history?: string
  initial_diagnosis?: string
  treatment_plan?: string
  observations?: string
}

export interface UpdateSessionNoteRequest {
  session_date?: string
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
  notes?: string
  is_private?: boolean
}

export interface SessionNoteListResponse {
  data: SessionNote[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Dashboard Types
export interface DashboardMetrics {
  estimated_revenue: number
  completed_consultations: number
  confirmed_consultations: number
  no_shows: number
  attendance_rate: number
  previous_attendance_rate: number
  estimated_lost_revenue: number
  agenda_occupancy: number
  open_slots: number
  future_sessions: number
  potential_revenue: number
  avoided_no_shows: number
  auto_confirmed: number
  preserved_revenue: number
  top_absentees: PatientAbsentee[]
  insights: string[]
}

export interface PatientAbsentee {
  name: string
  absent_count: number
}
