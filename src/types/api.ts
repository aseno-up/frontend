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

export interface DaySchedule {
  enabled: boolean
  start_time?: string
  end_time?: string
}

export interface BusinessHoursConfig {
  monday?: DaySchedule
  tuesday?: DaySchedule
  wednesday?: DaySchedule
  thursday?: DaySchedule
  friday?: DaySchedule
  saturday?: DaySchedule
  sunday?: DaySchedule
}

export interface ClinicSettings {
  timezone?: string
  default_appointment_minutes?: number
  reminder_hours_before?: number
  allow_online_booking?: boolean
  require_confirmation?: boolean
  whatsapp_reminders_enabled?: boolean
  email_reminders_enabled?: boolean
  require_payment_before_booking?: boolean
  ai_agent_enabled?: boolean
  ai_min_delay_between_messages?: number | null
  ai_min_delay_between_patients?: number | null
  ai_business_hours?: BusinessHoursConfig | null
}

export interface Clinic {
  id: string
  name: string
  slug: string
  type?: string
  email?: string
  phone?: string
  document?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  instagram?: string
  business_info?: string
  faq?: string
  logo_url?: string
  primary_color?: string
  created_at: string
  settings?: ClinicSettings
  booking_url?: string
  account?: Account
}

export interface Account {
  id: string
  subscription_status: 'trial' | 'active' | 'pending' | 'past_due' | 'canceled' | 'expired'
  trial_ends_at?: string
  plan?: {
    id: string
    name: string
    slug: string
  }
  settings?: ClinicSettings
  booking_url?: string
}

export interface PatientWhatsAppConnection {
  id?: string
  clinic_id: string
  patient_id: string
  whatsapp_connection_id?: string
  ai_scheduling_enabled: boolean
  reminders_enabled: boolean
  created_at?: string
  updated_at?: string
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

export interface ProfessionalProcedure {
  id: string
  professional_id: string
  procedure_id: string
  procedure_name: string
  procedure_price: number
  commission_type: 'percentage' | 'fixed'
  commission_value: number
  is_active: boolean
}

export type NoShowRisk = 'unknown' | 'low' | 'medium' | 'high'

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
  source: 'INTERNAL' | 'SELF_REGISTERED'
  merged_into_patient_id?: string
  no_show_risk: NoShowRisk
  no_show_count: number
  total_appointments: number
  attendance_rate: number
  risk_updated_at?: string
  created_at: string
}

export interface Procedure {
  id: string
  clinic_id: string
  name: string
  description: string
  price: number
  duration_minutes: number
  created_at: string
  updated_at: string
}

export interface AppointmentProcedure {
  appointment_id: string
  procedure_id: string
  price: number
  procedure?: Procedure
}

export interface AppointmentSpecialty {
  specialty_id: string
  name?: string
}

export interface Appointment {
  id: string
  clinic_id: string
  patient_id: string
  professional_id: string
  session_plan_id?: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  type: AppointmentType
  title: string
  notes: string
  patient_notes: string
  price: number
  payment_status: AppointmentPaymentStatus
  procedures: AppointmentProcedure[]
  specialties?: AppointmentSpecialty[]
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

export type PlanType = 'individual' | 'group'

export interface CalendarEvent {
  is_virtual: boolean
  // Common fields
  session_plan_id?: string
  start_time: string
  end_time: string
  title: string
  patient_id?: string
  professional_id?: string
  plan_type?: PlanType
  duration_mins?: number
  // Virtual-only
  virtual_date?: string
  // Group-only
  enrolled_count?: number
  capacity?: number
  // Real appointment fields (only when is_virtual=false)
  id?: string
  status?: AppointmentStatus
  type?: AppointmentType
  notes?: string
  patient_notes?: string
  price?: number
  payment_status?: string
  is_exception?: boolean
  // Relations
  patient_name?: string
  professional_name?: string
  professional_color?: string
  procedure_name?: string
}

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

export interface AppointmentProcedureInput {
  procedure_id: string
  price?: number
}

export interface CreateAppointmentRequest {
  patient_id: string
  professional_id: string
  specialty_ids?: string[]
  start_time: string
  duration_minutes: number
  title?: string
  notes?: string
  price?: number
  type?: AppointmentType
  procedures?: AppointmentProcedureInput[]
}

export interface UpdateAppointmentRequest {
  patient_id?: string
  professional_id?: string
  specialty_ids?: string[]
  start_time?: string
  duration_minutes?: number
  status?: AppointmentStatus
  title?: string
  notes?: string
  patient_notes?: string
  price?: number
  cancel_reason?: string
  procedures?: AppointmentProcedureInput[]
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

// Clinic membership info
export interface UserClinicInfo {
  clinic_id: string
  clinic_name: string
  role: UserRole
}

// Response Types
export interface AuthResponse {
  user: User
  clinic: Clinic
  access_token: string
  refresh_token: string
  expires_at: string
}

export interface CurrentUserResponse {
  user: User
  clinic: Clinic
  clinics?: UserClinicInfo[]
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
  provider?: string
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

// Appointment Payment Types (session-level)
export type PaymentMethodType = 'pix' | 'credit' | 'debit' | 'cash' | 'transfer' | 'other'
export type AppointmentPaymentStatus = 'pending' | 'partial' | 'paid'

export interface PaymentMethod {
  id: string
  clinic_id: string
  name: string
  type: PaymentMethodType
  active: boolean
  created_at: string
}

export interface AppointmentPayment {
  id: string
  appointment_id: string
  payment_method_id: string
  amount: number
  discount: number
  installments: number
  notes: string
  paid_at: string
  payment_method?: {
    id: string
    name: string
    type: string
  }
  created_at: string
}

export interface CreateAppointmentPaymentRequest {
  payment_method_id: string
  amount: number
  discount?: number
  notes?: string
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
  type?: 'individual' | 'group'
  frequency: Frequency
  week_days: number[]
  preferred_time: string
  day_times?: Record<string, string>
  duration_mins: number
  total_sessions: number
  sessions_done: number
  start_date: string
  end_date?: string
  session_price: number
  price_override?: number | null
  procedure_id?: string | null
  capacity?: number | null
  payment_mode?: string
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
  day_times?: Record<string, string>
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
  frequency?: Frequency
  week_days?: number[]
  day_times?: Record<string, string>
  professional_id?: string
  capacity?: number
}

export interface SessionPlanListResponse {
  data: SessionPlan[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Enrollment Types
export type EnrollmentStatus = 'active' | 'suspended' | 'cancelled'

export interface Enrollment {
  id: string
  session_plan_id: string
  patient_id: string
  status: EnrollmentStatus
  week_days: number[]
  total_sessions?: number | null
  sessions_done: number
  progress: number
  payment_mode: 'per_session' | 'upfront' | 'monthly'
  monthly_amount?: number | null
  billing_day?: number | null
  joined_at: string
  left_at?: string | null
  patient_name?: string
}

// Attendance Types
export type AttendanceStatus = 'present' | 'absent' | 'substituted'

export interface AttendanceRecord {
  id: string
  appointment_id: string
  patient_id: string
  enrollment_id?: string | null
  status: AttendanceStatus
  is_guest: boolean
  patient_name?: string
  created_at: string
}

// Plan Payment Types
export interface PlanPayment {
  id: string
  session_plan_id: string
  enrollment_id?: string | null
  payment_method_id: string
  amount: number
  discount: number
  installments: number
  reference_month?: string | null
  notes?: string
  paid_at?: string | null
  payment_method_name?: string
  created_at: string
  session_date?: string | null
  appointment_id?: string | null
  appointment_start_time?: string | null
  appointment_price?: number
}

// Invite Types
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'canceled'
export type UserRole = 'owner' | 'admin' | 'professional' | 'receptionist'

export interface Invite {
  id: string
  clinic_id: string
  email: string
  role: UserRole
  professional_id?: string
  status: InviteStatus
  expires_at: string
  created_at: string
}

export interface InviteDetails {
  id: string
  email: string
  role: UserRole
  professional_id?: string
  professional_name?: string
  clinic_name: string
  inviter_name: string
  expires_at: string
  is_valid: boolean
  is_expired: boolean
  user_exists: boolean
  user_name?: string
}

export interface CreateInviteRequest {
  email: string
  role: 'admin' | 'professional' | 'receptionist'
  professional_id?: string
  new_professional_name?: string
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
export interface AnamneseTemplateField {
  id: string
  template_id: string
  label: string
  field_key: string
  field_type: 'text' | 'textarea' | 'select' | 'multiselect' | 'scale' | 'section_header'
  options?: Record<string, any>
  required: boolean
  display_order: number
  placeholder?: string
}

export interface AnamneseTemplate {
  id: string
  clinic_id: string
  name: string
  is_default: boolean
  fields?: AnamneseTemplateField[]
  created_at: string
  updated_at: string
}

export interface PatientRecord {
  id: string
  clinic_id: string
  patient_id: string
  template_id?: string
  template?: AnamneseTemplate
  custom_fields: Record<string, any>
  recorded_at: string
  recorded_by: string
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

export interface CreatePatientRecordRequest {
  template_id?: string
  custom_fields: Record<string, any>
}

// In append-only, Update actually calls CreateRecord on the backend
export interface UpdatePatientRecordRequest {
  template_id?: string
  custom_fields: Record<string, any>
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
  annual_savings_projection: number
  top_absentees: PatientAbsentee[]
  insights: string[]
  smart_insights?: SmartInsight[]
}

export interface PatientAbsentee {
  name: string
  absent_count: number
}

export interface SmartInsight {
  type: 'patient_time' | 'professional_day' | 'best_time' | 'worst_time' | 'worst_day'
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  action_hint: string
}

// Notification Types
export type NotificationType =
  | 'appointment_reminder'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'whatsapp_connected'
  | 'whatsapp_disconnected'
  | 'trial_ending'
  | 'trial_expired'
  | 'new_patient'
  | 'system'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  created_at: string
}

// Plan and Offer Types
export interface PlanCycle {
  id: string
  plan_id: string
  cycle_type: 'monthly' | 'yearly' | 'lifetime'
  price_brl: number
}

export interface Plan {
  id: string
  name: string
  slug: string
  description: string
  features: string[]
  max_clinics: number
  max_professionals: number
  max_whatsapp_connections: number
  max_google_calendars: number
  has_api_access: boolean
  is_active: boolean
  created_at: string
  cycles: PlanCycle[]
}

export interface OfferCycle {
  id: string
  offer_id: string
  cycle_type: 'monthly' | 'yearly' | 'lifetime'
  custom_price_brl: number
}

export interface Offer {
  id: string
  plan_id: string
  plan?: Plan
  token: string
  description: string
  is_active: boolean
  max_uses: number
  current_uses: number
  expires_at?: string
  enforce_price_lock: boolean
  created_at: string
  cycles: OfferCycle[]
}

// Plan/Offer Requests
export type CreatePlanRequest = Omit<Plan, 'id' | 'created_at' | 'cycles'> & {
  cycles: Array<Omit<PlanCycle, 'id' | 'plan_id'>>
}

export type UpdatePlanRequest = Partial<CreatePlanRequest>

export type CreateOfferRequest = Omit<Offer, 'id' | 'created_at' | 'cycles' | 'current_uses'> & {
  cycles: Array<Omit<OfferCycle, 'id' | 'offer_id'>>
}

export type UpdateOfferRequest = Partial<CreateOfferRequest>

// CRM Leads
export type LeadType = 'estetica' | 'fisioterapia' | 'misto' | 'psicologia'
export type LeadChannel = 'outbound' | 'inbound'
export type LeadSource = 'google_maps' | 'instagram' | 'indicacao' | 'anuncio'
export type LeadStatus = 'identificado' | 'contactado' | 'respondeu' | 'demo_agendada' | 'trial_ativo' | 'negociando' | 'convertido' | 'sem_resposta' | 'descartado' | 'isca'
export type PainScore = 'alto' | 'medio' | 'baixo'

export interface Lead {
  id: string
  clinic_id: string
  account_id?: string
  clinic_name: string
  contact_name: string
  phone: string
  city: string
  type: LeadType
  channel: LeadChannel
  source: LeadSource
  status: LeadStatus
  pain_score: PainScore
  first_contact_at?: string
  next_follow_up_at?: string
  trial_start_at?: string
  trial_end_at?: string
  converted_at?: string
  cancelled_at?: string
  interest_plan: string
  contracted_plan: string
  cancellation_reason: string
  mrr: number
  site: string
  instagram: string
  contact_channel: string
  initial_message: string
  notes: string
  external_id: string
  created_at: string
  updated_at: string
}

// Marketplace types

export type SubaccountStatus = 'pending' | 'active' | 'rejected' | 'suspended'
export type FeeType = 'percentage' | 'fixed'

export interface Subaccount {
  id: string
  clinic_id: string
  asaas_account_id: string
  wallet_id: string
  status: SubaccountStatus
  company_name: string
  cpf_cnpj: string
  email: string
  created_at: string
}

export interface SplitConfig {
  id: string
  clinic_id: string
  fee_type: FeeType
  fee_value: number
  active: boolean
}

export interface CreateSubaccountInput {
  company_name: string
  cpf_cnpj: string
  company_type: string
  birth_date?: string
  income_value: number
  email: string
  phone?: string
  mobile_phone?: string
  postal_code?: string
  address?: string
  address_number?: string
  province?: string
  city?: string
  state?: string
}

export interface UpdateSplitConfigInput {
  fee_type: FeeType
  fee_value: number
  active?: boolean
}

export interface ClinicPayment {
  id: string
  clinic_id: string
  appointment_id?: string
  patient_id?: string
  asaas_payment_id: string
  value: number
  net_value: number
  split_fee_value: number
  status: PaymentStatus
  billing_type: string
  due_date: string
  payment_date?: string
  invoice_url?: string
  pix_qrcode_image?: string
  pix_copy_paste?: string
  description?: string
  installments?: number
  created_at: string
}

export interface MarketplaceBalance {
  balance: number
  totalPending?: number
  totalReceived?: number
}

export interface FinancialSummary {
  total_received: number
  total_pending: number
  total_fees: number
  net_received: number
  payments_by_method: Record<string, number>
  payment_count: number
}

// Patient merge types
export interface UnlinkedPatient {
  id: string
  name: string
  email: string
  cpf: string
  phone: string
  created_at: string
}

export interface PatientSearchResult {
  id: string
  name: string
  cpf: string
  email: string
  phone: string
  source: 'INTERNAL' | 'SELF_REGISTERED'
}

export interface BulkMergeResponse {
  appointments_reassigned: number
  target_patient_id: string
  merged_count: number
}
