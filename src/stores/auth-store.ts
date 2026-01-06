import { create } from 'zustand'
import { api } from '@/lib/api/client'
import type { User, Clinic, AuthResponse } from '@/types/api'

interface AuthState {
  user: User | null
  clinic: Clinic | null
  isLoading: boolean
  isAuthenticated: boolean

  login: (email: string, password: string) => Promise<void>
  googleLogin: (idToken: string) => Promise<void>
  register: (data: { clinic_name: string; name: string; email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  setUser: (user: User, clinic: Clinic) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  clinic: null,
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
  },

  googleLogin: async (idToken: string) => {
    const response: AuthResponse = await api.googleLogin(idToken)
    api.setTokens(response.access_token, response.refresh_token)
    set({
      user: response.user,
      clinic: response.clinic,
      isAuthenticated: true,
      isLoading: false,
    })
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
  },

  logout: async () => {
    await api.logout()
    set({
      user: null,
      clinic: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  loadUser: async () => {
    try {
      api.loadTokenFromStorage()
      const response = await api.getCurrentUser()
      set({
        user: response.user,
        clinic: response.clinic,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      api.clearTokens()
      set({
        user: null,
        clinic: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  setUser: (user: User, clinic: Clinic) => {
    set({ user, clinic, isAuthenticated: true, isLoading: false })
  },
}))
