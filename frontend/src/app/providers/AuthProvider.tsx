import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import {
  clearAccessToken,
  clearStoredAuthProfile,
  getAccessToken,
  getAccessTokenSubject,
  getStoredAuthProfile,
  logout as requestLogout,
  refreshAccessToken,
  setAccessToken,
  setStoredAuthProfile,
  type AuthUser,
} from '../../domains/auth'
import { calendarKeys } from '../../domains/calendar'
import {
  removeLinkedParticipantSessions,
  removeParticipantSessionsExceptUser,
} from '../../domains/participant'
import { configureMainAuth, isApiError } from '../../shared/api/httpClient'
import { clearParticipantPrivateData } from '../cache/calendarCache'

export type AuthStatus = 'restoring' | 'authenticated' | 'anonymous' | 'restore-failed'

interface AuthContextValue {
  accessToken: string | null
  status: AuthStatus
  user: AuthUser | null
  userUuid: string | null
  completeLogin: (accessToken: string, user: AuthUser) => void
  logout: () => Promise<void>
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
  const queryClient = useQueryClient()
  const [accessToken, setCurrentAccessToken] = useState<string | null>(null)
  const [status, setStatus] = useState<AuthStatus>('restoring')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userUuid, setUserUuid] = useState<string | null>(null)
  const sessionEpoch = useRef(0)
  const identityRef = useRef<string | null>(null)

  const clearMemberData = useCallback((identity?: string) => {
    const removedSessions = removeLinkedParticipantSessions(identity)
    clearParticipantPrivateData(queryClient, removedSessions)
    if (identity) queryClient.removeQueries({ queryKey: calendarKeys.my(identity), exact: true })
  }, [queryClient])

  const applyAuthenticatedToken = useCallback((token: string, nextUser?: AuthUser | null, sessionChangeAlreadyMarked = false) => {
    const nextUserUuid = getAccessTokenSubject(token) ?? nextUser?.user_uuid ?? null
    if (!nextUserUuid) throw new Error('Access Token에서 회원 식별자를 확인할 수 없습니다.')

    const previousUserUuid = identityRef.current
    if (previousUserUuid && previousUserUuid !== nextUserUuid) {
      if (!sessionChangeAlreadyMarked) sessionEpoch.current += 1
      clearMemberData(previousUserUuid)
    }
    clearParticipantPrivateData(queryClient, removeParticipantSessionsExceptUser(nextUserUuid))

    const restoredUser = nextUser ?? getStoredAuthProfile(nextUserUuid)
    if (restoredUser) setStoredAuthProfile(restoredUser)
    else clearStoredAuthProfile()

    identityRef.current = nextUserUuid
    setAccessToken(token)
    setCurrentAccessToken(token)
    setUser(restoredUser)
    setUserUuid(nextUserUuid)
    setStatus('authenticated')
    return token
  }, [clearMemberData, queryClient])

  const expireAuthentication = useCallback(() => {
    sessionEpoch.current += 1
    const expiredUserUuid = identityRef.current
    clearMemberData(expiredUserUuid ?? undefined)
    clearStoredAuthProfile()
    clearAccessToken()
    identityRef.current = null
    setCurrentAccessToken(null)
    setUser(null)
    setUserUuid(null)
    setStatus('anonymous')
  }, [clearMemberData])

  const refreshForRequest = useCallback(async () => {
    const refreshEpoch = sessionEpoch.current
    const token = await restoreAccessToken()
    if (sessionEpoch.current !== refreshEpoch) {
      const currentToken = getAccessToken()
      if (!currentToken) throw new Error('인증 세션이 변경되었습니다.')
      return currentToken
    }
    return applyAuthenticatedToken(token)
  }, [applyAuthenticatedToken])

  useLayoutEffect(() => {
    configureMainAuth({
      getAccessToken,
      getSessionSnapshot: () => ({
        userUuid: identityRef.current,
        sessionVersion: sessionEpoch.current,
        accessToken: getAccessToken(),
      }),
      refreshAccessToken: refreshForRequest,
      onAuthExpired: expireAuthentication,
    })
    return () => configureMainAuth(null)
  }, [expireAuthentication, refreshForRequest])

  useEffect(() => {
    let active = true
    const restoreEpoch = sessionEpoch.current

    void restoreAccessToken()
      .then((token) => {
        if (!active || sessionEpoch.current !== restoreEpoch) return

        applyAuthenticatedToken(token)
      })
      .catch((error: unknown) => {
        if (!active || sessionEpoch.current !== restoreEpoch) return

        if (isApiError(error) && error.status === 401) {
          expireAuthentication()
        } else {
          clearAccessToken()
          setCurrentAccessToken(null)
          setUser(null)
          setUserUuid(null)
          setStatus('restore-failed')
        }
      })

    return () => {
      active = false
    }
  }, [applyAuthenticatedToken, expireAuthentication])

  const completeLogin = useCallback((token: string, nextUser: AuthUser) => {
    sessionEpoch.current += 1
    applyAuthenticatedToken(token, nextUser, true)
  }, [applyAuthenticatedToken])

  const logout = useCallback(async () => {
    try {
      await requestLogout()
    } catch (error) {
      if (!isApiError(error) || error.status !== 401) throw error
    }
    expireAuthentication()
  }, [expireAuthentication])

  const value = useMemo(
    () => ({ accessToken, status, user, userUuid, completeLogin, logout }),
    [accessToken, completeLogin, logout, status, user, userUuid],
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
