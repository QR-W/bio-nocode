import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types/user'

interface AuthState {
    currentUser: User | null
    setUser: (user: User | null) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            currentUser: null,
            setUser: (user) => set({ currentUser: user }),
            logout: () => set({ currentUser: null }),
        }),
        { name: 'nocode-auth' }
    )
)