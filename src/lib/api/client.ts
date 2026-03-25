import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/types/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

// Export API URL for SSE connections
export function getApiUrl(): string {
  return API_URL
}

class ApiClient {
  private client: AxiosInstance
  private accessToken: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      withCredentials: true, // Enable cookies for cross-origin requests
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor: Authorization header is no longer needed with cookies,
    // but we leave this structure in case we want to support non-browser clients later.
    // For now, accessToken will likely be null.
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Prevent infinite loop: if the failed request was already to the refresh endpoint, don't retry.
        if (originalRequest.url?.includes('/auth/refresh')) {
          return Promise.reject(error)
        }

        // Handle subscription expired (HTTP 402)
        if (error.response?.status === 402) {
          const errorData = error.response?.data as ApiError
          if (errorData?.error?.type === 'SUBSCRIPTION_EXPIRED') {
            // Emit custom event for SubscriptionGuard to handle
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('subscription-expired'))
            }
          }
          return Promise.reject(error)
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            // Attempt to refresh token using the HttpOnly cookie
            await this.refreshAccessToken()
            // If successful, the backend has set new cookies.
            // Retry the original request.
            return this.client(originalRequest)
          } catch {
            // Refresh failed (cookie invalid or expired)
            if (typeof window !== 'undefined') {
              // Only redirect if we are not already on the login page to avoid page reload loops
              if (!window.location.pathname.includes('/login')) {
                 window.location.href = '/login'
              }
            }
          }
        }

        return Promise.reject(error)
      }
    )
  }

  setTokens(accessToken: string, refreshToken: string) {
    // No-op: Tokens are handled via HttpOnly cookies by the browser.
    // We keep this method signature to avoid breaking existing calls.
    this.accessToken = null 
  }

  clearTokens() {
    // No-op: Cookies are cleared by the /auth/logout endpoint.
    this.accessToken = null
  }

  getRefreshToken(): string | null {
    // Refresh token is in HttpOnly cookie, cannot be accessed by JS.
    return null
  }

  loadTokenFromStorage() {
    // No-op: No tokens in localStorage.
  }

  private async refreshAccessToken(refreshToken?: string) {
    // We send an empty body; backend uses the refresh_token cookie.
    const response = await this.client.post('/auth/refresh', {})
    return response.data
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password })
    return response.data
  }

  async register(data: { clinic_name: string; name: string; email: string; password: string }) {
    const response = await this.client.post('/auth/register', data)
    return response.data
  }

  async googleLogin(idToken: string, plan?: string, billing?: string) {
    const body: Record<string, string> = { id_token: idToken }
    if (plan) body.plan = plan
    if (billing) body.billing = billing
    const response = await this.client.post('/auth/google', body)
    return response.data
  }

  async logout() {
    try {
      await this.client.post('/auth/logout')
    } finally {
      this.clearTokens()
    }
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me')
    return response.data
  }

  // Professionals endpoints
  async getProfessionals(params?: { page?: number; limit?: number; search?: string; status?: string; sort_by?: string }) {
    const response = await this.client.get('/professionals', { params })
    return response.data
  }

  async getProfessional(id: string) {
    const response = await this.client.get(`/professionals/${id}`)
    return response.data
  }

  async createProfessional(data: Record<string, unknown>) {
    const response = await this.client.post('/professionals', data)
    return response.data
  }

  async updateProfessional(id: string, data: Record<string, unknown>) {
    const response = await this.client.put(`/professionals/${id}`, data)
    return response.data
  }

  async deleteProfessional(id: string) {
    const response = await this.client.delete(`/professionals/${id}`)
    return response.data
  }

  async bulkDeleteProfessionals(ids: string[]) {
    const response = await this.client.post('/professionals/bulk-delete', { ids })
    return response.data
  }

  // Patients endpoints
  async getPatients(params?: { page?: number, limit?: number, search?: string, status?: string, sort_by?: string }) {
    const page = params?.page || 1
    const limit = params?.limit || 20
    const search = params?.search
    const status = params?.status
    const sort_by = params?.sort_by

    const response = await this.client.get('/patients', {
      params: { page, limit, search, status, sort_by },
    })
    return response.data
  }

  async getPatient(id: string) {
    const response = await this.client.get(`/patients/${id}`)
    return response.data
  }

  async createPatient(data: Record<string, unknown>) {
    const response = await this.client.post('/patients', data)
    return response.data
  }

  async updatePatient(id: string, data: Record<string, unknown>) {
    const response = await this.client.put(`/patients/${id}`, data)
    return response.data
  }

  async deletePatient(id: string) {
    const response = await this.client.delete(`/patients/${id}`)
    return response.data
  }

  async bulkDeletePatients(ids: string[]) {
    const response = await this.client.post('/patients/bulk-delete', { ids })
    return response.data
  }

  // Procedures endpoints
  async getProcedures(params?: { page?: number; limit?: number; search?: string; status?: string; sort_by?: string }) {
    const response = await this.client.get('/procedures', { params })
    return response.data
  }

  async getProcedure(id: string) {
    const response = await this.client.get(`/procedures/${id}`)
    return response.data
  }

  async createProcedure(data: Record<string, unknown>) {
    const response = await this.client.post('/procedures', data)
    return response.data
  }

  async updateProcedure(id: string, data: Record<string, unknown>) {
    const response = await this.client.put(`/procedures/${id}`, data)
    return response.data
  }

  async deleteProcedure(id: string) {
    const response = await this.client.delete(`/procedures/${id}`)
    return response.data
  }

  async bulkDeleteProcedures(ids: string[]) {
    const response = await this.client.post('/procedures/bulk-delete', { ids })
    return response.data
  }

  // Appointments endpoints
  async getAppointments(params: {
    page?: number
    per_page?: number
    professional_id?: string
    patient_id?: string
    status?: string
    start_date?: string
    end_date?: string
  }) {
    const response = await this.client.get('/appointments', { params })
    return response.data
  }

  async getAppointmentsByDay(date: string, professionalId?: string) {
    const response = await this.client.get(`/appointments/day/${date}`, {
      params: professionalId ? { professional_id: professionalId } : undefined,
    })
    return response.data
  }

  async getAppointmentsByWeek(date: string, professionalId?: string) {
    const response = await this.client.get(`/appointments/week/${date}`, {
      params: professionalId ? { professional_id: professionalId } : undefined,
    })
    return response.data
  }

  async getAppointment(id: string) {
    const response = await this.client.get(`/appointments/${id}`)
    return response.data
  }

  async createAppointment(data: Record<string, unknown>) {
    const response = await this.client.post('/appointments', data)
    return response.data
  }

  async updateAppointment(id: string, data: Record<string, unknown>) {
    const response = await this.client.put(`/appointments/${id}`, data)
    return response.data
  }

  async deleteAppointment(id: string) {
    const response = await this.client.delete(`/appointments/${id}`)
    return response.data
  }

  async confirmAppointment(id: string, patientNotes?: string) {
    const response = await this.client.post(`/appointments/${id}/confirm`, {
      patient_notes: patientNotes,
    })
    return response.data
  }

  async cancelAppointment(id: string, reason?: string) {
    const response = await this.client.post(`/appointments/${id}/cancel`, {
      reason,
    })
    return response.data
  }

  async completeAppointment(id: string) {
    const response = await this.client.post(`/appointments/${id}/complete`)
    return response.data
  }

  async markNoShow(id: string) {
    const response = await this.client.post(`/appointments/${id}/no-show`)
    return response.data
  }

  // WhatsApp endpoints
  async getWhatsAppStatus() {
    const response = await this.client.get('/whatsapp/status')
    return response.data
  }

  async connectWhatsApp() {
    const response = await this.client.post('/whatsapp/connect')
    return response.data
  }

  async updateWhatsAppConfig(data: {
    provider: string
    waba_id?: string
    phone_number_id?: string
    token?: string
    instance?: string
  }) {
    const response = await this.client.post('/whatsapp/config', data)
    return response.data
  }

  async disconnectWhatsApp() {
    const response = await this.client.post('/whatsapp/disconnect')
    return response.data
  }

  async getWhatsAppQRCode() {
    const response = await this.client.get('/whatsapp/qrcode')
    return response.data
  }

  async sendWhatsAppMessage(phone: string, message: string) {
    console.log('[API] Sending WhatsApp message:', { phone, message })
    try {
      const response = await this.client.post('/whatsapp/send', { phone, message })
      console.log('[API] WhatsApp message sent successfully:', response.data)
      return response.data
    } catch (error) {
      console.error('[API] Error sending WhatsApp message:', error)
      throw error
    }
  }

  async sendWhatsAppConfirmation(data: {
    appointment_id: string
    patient_name: string
    patient_phone: string
    professional_name: string
    appointment_time: string
    appointment_date: string
  }) {
    const response = await this.client.post('/whatsapp/send-confirmation', data)
    return response.data
  }

  // Billing/Payment endpoints
  async getBillingCustomer() {
    const response = await this.client.get('/billing/customer')
    return response.data
  }

  async createBillingCustomer(data: {
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
  }) {
    const response = await this.client.post('/billing/customer', data)
    return response.data
  }

  async getPayments(page = 1, perPage = 20) {
    const response = await this.client.get('/billing/payments', {
      params: { page, per_page: perPage },
    })
    return response.data
  }

  async getPayment(id: string) {
    const response = await this.client.get(`/billing/payments/${id}`)
    return response.data
  }

  async createPayment(data: {
    billing_type: string
    value: number
    due_date: string
    description?: string
  }) {
    const response = await this.client.post('/billing/payments', data)
    return response.data
  }

  async cancelPayment(id: string) {
    const response = await this.client.delete(`/billing/payments/${id}`)
    return response.data
  }

  async getPaymentPixQRCode(id: string) {
    const response = await this.client.get(`/billing/payments/${id}/pix`)
    return response.data
  }

  async getSubscription() {
    const response = await this.client.get('/billing/subscription')
    return response.data
  }

  async createSubscription(data: {
    billing_type: string
    plan: 'basic' | 'professional' | 'advanced'
    cycle: string
  }) {
    const response = await this.client.post('/billing/subscription', data)
    return response.data
  }

  async cancelSubscription() {
    const response = await this.client.delete('/billing/subscription')
    return response.data
  }

  async switchPlan(data: {
    plan: 'basic' | 'professional' | 'advanced'
    billing_type: string
    cycle: string
    offer_token?: string
    credit_card?: {
      holderName: string
      number: string
      expiryMonth: string
      expiryYear: string
      ccv: string
    }
    credit_card_holder_info?: {
      name: string
      email: string
      cpfCnpj: string
      postalCode: string
      phone: string
    }
  }) {
    const response = await this.client.post('/billing/switch-plan', data)
    return response.data
  }

  async getSubscriptionPayments() {
    const response = await this.client.get('/billing/subscription/payments')
    return response.data
  }

  // Google Calendar endpoints
  async getCalendarAuthURL() {
    const response = await this.client.get('/calendar/auth-url')
    return response.data
  }

  async getCalendarIntegration() {
    const response = await this.client.get('/calendar/integration')
    return response.data
  }

  async listGoogleCalendars() {
    const response = await this.client.get('/calendar/calendars')
    return response.data
  }

  async setGoogleCalendar(calendarId: string) {
    const response = await this.client.post('/calendar/calendar', { calendar_id: calendarId })
    return response.data
  }

  async updateCalendarSettings(syncEnabled: boolean, syncDirection: string) {
    const response = await this.client.put('/calendar/settings', {
      sync_enabled: syncEnabled,
      sync_direction: syncDirection,
    })
    return response.data
  }

  async disconnectCalendar() {
    const response = await this.client.delete('/calendar/disconnect')
    return response.data
  }

  // Session Plan endpoints
  async getSessionPlans(params?: { page?: number; limit?: number; status?: string; search?: string; sort_by?: string }) {
    const response = await this.client.get('/session-plans', { params })
    return response.data
  }

  async getSessionPlan(id: string) {
    const response = await this.client.get(`/session-plans/${id}`)
    return response.data
  }

  async getSessionPlansByPatient(patientId: string) {
    const response = await this.client.get(`/session-plans/patient/${patientId}`)
    return response.data
  }

  async createSessionPlan(data: {
    patient_id: string
    professional_id?: string
    title: string
    description?: string
    frequency: string
    week_days?: number[]
    preferred_time: string
    duration_mins: number
    total_sessions: number
    start_date: string
    session_price?: number
    notes?: string
  }) {
    const response = await this.client.post('/session-plans', data)
    return response.data
  }

  async updateSessionPlan(id: string, data: Record<string, unknown>) {
    const response = await this.client.put(`/session-plans/${id}`, data)
    return response.data
  }

  async pauseSessionPlan(id: string) {
    const response = await this.client.put(`/session-plans/${id}/pause`)
    return response.data
  }

  async resumeSessionPlan(id: string) {
    const response = await this.client.put(`/session-plans/${id}/resume`)
    return response.data
  }

  async cancelSessionPlan(id: string) {
    const response = await this.client.put(`/session-plans/${id}/cancel`)
    return response.data
  }

  async deleteSessionPlan(id: string) {
    const response = await this.client.delete(`/session-plans/${id}`)
    return response.data
  }

  async bulkCancelSessionPlans(ids: string[]) {
    const response = await this.client.post('/session-plans/bulk-cancel', { ids })
    return response.data
  }

  async generateSessionPlanAppointments(id: string, weeksAhead = 2) {
    const response = await this.client.post(`/session-plans/${id}/generate`, {
      weeks_ahead: weeksAhead,
    })
    return response.data
  }

  // Invite endpoints
  async getInvites(page = 1, perPage = 20) {
    const response = await this.client.get('/invites', {
      params: { page, per_page: perPage },
    })
    return response.data
  }

  async createInvite(data: { email: string; role: string }) {
    const response = await this.client.post('/invites', data)
    return response.data
  }

  async cancelInvite(id: string) {
    const response = await this.client.delete(`/invites/${id}`)
    return response.data
  }

  async resendInvite(id: string) {
    const response = await this.client.post(`/invites/${id}/resend`)
    return response.data
  }

  async getInviteByToken(token: string) {
    const response = await this.client.get(`/auth/invite/${token}`)
    return response.data
  }

  async acceptInvite(data: { token: string; name: string; password: string }) {
    const response = await this.client.post('/auth/accept-invite', data)
    return response.data
  }

  async forgotPassword(email: string) {
    const response = await this.client.post('/auth/forgot-password', { email })
    return response.data
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await this.client.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    })
    return response.data
  }

  async verifyEmail(token: string) {
    const response = await this.client.post('/auth/verify-email', { token })
    return response.data
  }

  async resendVerificationEmail(email: string) {
    const response = await this.client.post('/auth/resend-verification', { email })
    return response.data
  }

  // User Management endpoints
  async getUsers(params: Record<string, any>) {
    const response = await this.client.get('/users', { params })
    return response.data
  }

  async getUser(id: string) {
    const response = await this.client.get(`/users/${id}`)
    return response.data
  }

  async updateUser(id: string, data: { name?: string; phone?: string; avatar_url?: string; is_active?: boolean }) {
    const response = await this.client.put(`/users/${id}`, data)
    return response.data
  }

  async updateUserRole(id: string, role: string) {
    const response = await this.client.patch(`/users/${id}/role`, { role })
    return response.data
  }

  async deactivateUser(id: string) {
    const response = await this.client.post(`/users/${id}/deactivate`)
    return response.data
  }

  async reactivateUser(id: string) {
    const response = await this.client.post(`/users/${id}/reactivate`)
    return response.data
  }

  async removeUser(id: string) {
    const response = await this.client.delete(`/users/${id}`)
    return response.data
  }

  async bulkRemoveUsers(ids: string[]) {
    const response = await this.client.post('/users/bulk-delete', { ids })
    return response.data
  }

  // Patient Record (Ficha) endpoints
  async getPatientRecord(patientId: string) {
    const response = await this.client.get(`/patients/${patientId}/record`)
    return response.data
  }

  async updatePatientRecord(patientId: string, data: {
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
  }) {
    const response = await this.client.put(`/patients/${patientId}/record`, data)
    return response.data
  }

  async getFullPatientRecord(patientId: string) {
    const response = await this.client.get(`/patients/${patientId}/record/full`)
    return response.data
  }

  // Session Notes endpoints
  async getSessionNotes(patientId: string, page = 1, perPage = 20) {
    const response = await this.client.get(`/patients/${patientId}/notes`, {
      params: { page, per_page: perPage },
    })
    return response.data
  }

  async getSessionNote(patientId: string, noteId: string) {
    const response = await this.client.get(`/patients/${patientId}/notes/${noteId}`)
    return response.data
  }

  async createSessionNote(patientId: string, data: {
    appointment_id?: string
    session_date: string
    subjective?: string
    objective?: string
    assessment?: string
    plan?: string
    notes?: string
    is_private?: boolean
  }) {
    const response = await this.client.post(`/patients/${patientId}/notes`, data)
    return response.data
  }

  async updateSessionNote(patientId: string, noteId: string, data: {
    session_date?: string
    subjective?: string
    objective?: string
    assessment?: string
    plan?: string
    notes?: string
    is_private?: boolean
  }) {
    const response = await this.client.put(`/patients/${patientId}/notes/${noteId}`, data)
    return response.data
  }

  async deleteSessionNote(patientId: string, noteId: string) {
    const response = await this.client.delete(`/patients/${patientId}/notes/${noteId}`)
    return response.data
  }

  // Dashboard endpoints
  async getDashboardMetrics(startDate?: string, endDate?: string) {
    const response = await this.client.get('/dashboard/metrics', {
      params: { start_date: startDate, end_date: endDate },
    })
    return response.data
  }

  // Analytics/Reports endpoints
  async getReportMetrics(period: string = '3m', professionalId?: string) {
    const response = await this.client.get('/analytics/reports', {
      params: { period, professional_id: professionalId },
    })
    return response.data
  }

  // Onboarding endpoints
  async getOnboardingStatus() {
    const response = await this.client.get('/onboarding/status')
    return response.data
  }

  // Notification endpoints
  async getNotifications(limit = 50, offset = 0) {
    const response = await this.client.get('/notifications', {
      params: { limit, offset },
    })
    return response.data
  }

  async getUnreadNotificationCount(): Promise<{ count: number }> {
    const response = await this.client.get('/notifications/unread-count')
    return response.data
  }

  async markNotificationAsRead(id: string) {
    const response = await this.client.post(`/notifications/${id}/read`)
    return response.data
  }

  async markAllNotificationsAsRead() {
    const response = await this.client.post('/notifications/read-all')
    return response.data
  }

  async deleteNotification(id: string) {
    const response = await this.client.delete(`/notifications/${id}`)
    return response.data
  }

  async getSSEToken(): Promise<{ token: string }> {
    const response = await this.client.get('/notifications/sse-token')
    return response.data
  }

  // Clinic endpoints
  async getClinic() {
    const response = await this.client.get('/clinic')
    return response.data
  }

  async updateClinic(data: {
    name?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zip_code?: string
    logo_url?: string
    primary_color?: string
    settings?: {
      timezone?: string
      default_appointment_minutes?: number
      reminder_hours_before?: number
      allow_online_booking?: boolean
      require_confirmation?: boolean
      whatsapp_reminders_enabled?: boolean
      email_reminders_enabled?: boolean
      ai_agent_enabled?: boolean
      ai_min_delay_between_messages?: number | null
      ai_min_delay_between_patients?: number | null
      ai_business_hours?: any
    }
  }) {
    const response = await this.client.put('/clinic', data)
    return response.data
  }

  // ==========================================
  // Admin Settings (dev clinics only)
  // ==========================================

  async getAdminSettings(): Promise<{
    settings: Record<string, { value: string; description: string }>
  }> {
    const response = await this.client.get('/admin/settings')
    return response.data
  }

  async updateAdminSetting(key: string, value: string): Promise<{
    message: string
    key: string
    value: string
  }> {
    const response = await this.client.put(`/admin/settings/${key}`, { value })
    return response.data
  }

  // ==========================================
  // Plans & Offers Settings (admin only)
  // ==========================================

  async getPlans() {
    const response = await this.client.get('/plans')
    return response.data
  }

  async createPlan(data: any) {
    const response = await this.client.post('/admin/plans', data)
    return response.data
  }

  async updatePlan(id: string, data: any) {
    const response = await this.client.put(`/admin/plans/${id}`, data)
    return response.data
  }

  async getOffers() {
    const response = await this.client.get('/admin/offers')
    return response.data
  }

  async createOffer(data: any) {
    const response = await this.client.post('/admin/offers', data)
    return response.data
  }

  async updateOffer(id: string, data: any) {
    const response = await this.client.put(`/admin/offers/${id}`, data)
    return response.data
  }

  // ==========================================
  // Sprint 6: Admin Observability & Control
  // ==========================================

  async getAuditLogs(params?: {
    page?: number
    limit?: number
    action?: string
    entity_type?: string
    user_id?: string
    start_date?: string
    end_date?: string
  }) {
    const response = await this.client.get('/admin/audit-logs', { params })
    return response.data
  }

  async getSystemLogs(params?: {
    page?: number
    limit?: number
    service?: string
    event?: string
    status?: string
    clinic_id?: string
    start_date?: string
    end_date?: string
  }) {
    const response = await this.client.get('/admin/system-logs', { params })
    return response.data
  }

  async getFeatureFlags() {
    const response = await this.client.get('/admin/feature-flags')
    return response.data
  }

  async createFeatureFlag(data: { key: string; description?: string; enabled: boolean; clinic_id?: string }) {
    const response = await this.client.post('/admin/feature-flags', data)
    return response.data
  }

  async updateFeatureFlag(id: string, data: { description?: string; enabled?: boolean }) {
    const response = await this.client.put(`/admin/feature-flags/${id}`, data)
    return response.data
  }

  async deleteFeatureFlag(id: string) {
    const response = await this.client.delete(`/admin/feature-flags/${id}`)
    return response.data
  }

  async getUsageMetrics(params?: {
    page?: number
    limit?: number
    clinic_id?: string
    metric?: string
    start_date?: string
    end_date?: string
  }) {
    const response = await this.client.get('/admin/usage-metrics', { params })
    return response.data
  }

  async getUsageMetricsSummary(params?: { start_date?: string; end_date?: string }) {
    const response = await this.client.get('/admin/usage-metrics/summary', { params })
    return response.data
  }

  // ==========================================
  // Public Config (no auth required)
  // ==========================================

  async getPublicConfig(): Promise<{
    plans: Record<string, {
      limit_professionals: number
      price_monthly: number
      excess_price_per_professional: number
      features: string[]
    }>
    trial_days: number
  }> {
    // Use axios directly without auth interceptor
    const response = await axios.get(`${API_URL}/public/config`)
    return response.data
  }
}

export const api = new ApiClient()