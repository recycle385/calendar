import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface GuardProps {
  authenticated: boolean
  children: ReactNode
}

export function ProtectedRoute({ authenticated, children }: GuardProps) {
  const location = useLocation()

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export function PublicOnlyRoute({ authenticated, children }: GuardProps) {
  if (authenticated) {
    return <Navigate to="/" replace />
  }

  return children
}
