import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import {
  clearAccessToken,
  refreshAccessToken,
  setAccessToken,
  type AuthUser,
} from '../../domains/auth'
import { isApiError } from '../../shared/api/httpClient'

export type AuthStatus = 'restoring' | 'authenticated' | 'anonymous' | 'restore-failed'

interface AuthContextValue {
  accessToken: string | null
  status: AuthStatus
  user: AuthUser | null
  completeLogin: (accessToken: string, user: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

let refreshInFlight: Promise<string> | null = null

function restoreAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken()
      .then(({ accessToken }) => accessToken)
      .finally(() => {
        refreshInFlight = null
      })
  }

  return refreshInFlight
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setCurrentAccessToken] = useState<string | null>(null)
  const [status, setStatus] = useState<AuthStatus>('restoring')
  const [user, setUser] = useState<AuthUser | null>(null)
  const sessionEpoch = useRef(0)

  useEffect(() => {
    let active = true
    const restoreEpoch = sessionEpoch.current

    void restoreAccessToken()
      .then((token) => {
        if (!active || sessionEpoch.current !== restoreEpoch) return

        setAccessToken(token)
        setCurrentAccessToken(token)
        setStatus('authenticated')
      })
      .catch((error: unknown) => {
        if (!active || sessionEpoch.current !== restoreEpoch) return

        clearAccessToken()
        setCurrentAccessToken(null)
        setStatus(isApiError(error) && error.status === 401 ? 'anonymous' : 'restore-failed')
      })

    return () => {
      active = false
    }
  }, [])

  const completeLogin = useCallback((token: string, nextUser: AuthUser) => {
    sessionEpoch.current += 1
    setAccessToken(token)
    setCurrentAccessToken(token)
    setUser(nextUser)
    setStatus('authenticated')
  }, [])

  const value = useMemo(
    () => ({ accessToken, status, user, completeLogin }),
    [accessToken, completeLogin, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return value
}
