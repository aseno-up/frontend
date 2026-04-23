import { create } from 'zustand'
import { api } from '@/lib/api/client'
import type { User, Clinic, AuthResponse, UserClinicInfo, CurrentUserResponse } from '@/types/api'

interface AuthState {
  user: User | null
  clinic: Clinic | null
  clinics: UserClinicInfo[]
  isLoading: boolean
  isAuthenticated: boolean

  login: (email: string, password: string) => Promise<void>
  googleLogin: (idToken: string, plan?: string, billing?: string) => Promise<void>
  register: (data: {
    clinic_name: string
    name: string
    email: string
    password: string
    phone?: string
    document?: string
    plan?: string
    billing?: string
    variant?: 'solo'
  }) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  setUser: (user: User, clinic: Clinic) => void
  setClinic: (clinic: Clinic) => void
  switchClinic: (clinicId: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  clinic: null,
  clinics: [],
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const response: AuthResponse = await api.login(email, password)
    api.setTokens(response.access_token, response.refresh_token)
    set({
      user: response.user,
      clinic: response.clinic,
      isAuthenticated: true,
      isLoading: false,
    })
    // Load clinics list after login
    try {
      const me: CurrentUserResponse = await api.getCurrentUser()
      set({ clinics: me.clinics || [] })
    } catch { /* ignore */ }
  },

  googleLogin: async (idToken: string, plan?: string, billing?: string) => {
    const response: AuthResponse = await api.googleLogin(idToken, plan, billing)
    api.setTokens(response.access_token, response.refresh_token)
    set({
      user: response.user,
      clinic: response.clinic,
      isAuthenticated: true,
      isLoading: false,
    })
    try {
      const me: CurrentUserResponse = await api.getCurrentUser()
      set({ clinics: me.clinics || [] })
    } catch { /* ignore */ }
  },

  register: async (data) => {
    const response: AuthResponse = await api.register(data)
    api.setTokens(response.access_token, response.refresh_token)
    set({
      user: response.user,
      clinic: response.clinic,
      isAuthenticated: true,
      isLoading: false,
    })
    try {
      const me: CurrentUserResponse = await api.getCurrentUser()
      set({ clinics: me.clinics || [] })
    } catch { /* ignore */ }
  },

  logout: async () => {
    await api.logout()
    set({
      user: null,
      clinic: null,
      clinics: [],
      isAuthenticated: false,
      isLoading: false,
    })
  },

  loadUser: async () => {
    try {
      api.loadTokenFromStorage()
      const response: CurrentUserResponse = await api.getCurrentUser()
      set({
        user: response.user,
        clinic: response.clinic,
        clinics: response.clinics || [],
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      api.clearTokens()
      set({
        user: null,
        clinic: null,
        clinics: [],
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  setUser: (user: User, clinic: Clinic) => {
    set({ user, clinic, isAuthenticated: true, isLoading: false })
  },

  setClinic: (clinic: Clinic) => {
    set({ clinic })
  },

  switchClinic: async (clinicId: string) => {
    const response: AuthResponse = await api.switchClinic(clinicId)
    api.setTokens(response.access_token, response.refresh_token)
    set({
      user: response.user,
      clinic: response.clinic,
      isAuthenticated: true,
    })
  },
}))
