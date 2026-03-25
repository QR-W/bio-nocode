import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const currentUser = useAuthStore(s => s.currentUser)
    if (!currentUser) return <Navigate to="/auth" replace />
    return <>{children}</>
}