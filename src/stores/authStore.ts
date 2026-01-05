import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Admin, AdminSession } from '@/types'

interface AuthState {
  admin: Admin | null
  session: AdminSession | null
  isAuthenticated: boolean
  setAuth: (admin: Admin, session: AdminSession) => void
  logout: () => void
  isSessionValid: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      session: null,
      isAuthenticated: false,

      setAuth: (admin, session) => set({
        admin,
        session,
        isAuthenticated: true
      }),

      logout: () => set({
        admin: null,
        session: null,
        isAuthenticated: false
      }),

      isSessionValid: () => {
        const { session } = get()
        if (!session) return false
        return new Date(session.expires_at) > new Date()
      },
    }),
    {
      name: 'admin-auth-storage',
    }
  )
)
