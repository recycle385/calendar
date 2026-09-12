let accessToken: string | null = null
const AUTH_PROFILE_KEY = 'authProfile'

interface StoredAuthProfile {
  userUuid: string
  user: import('./types').AuthUser
}

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string) {
  accessToken = token
}

export function clearAccessToken() {
  accessToken = null
}

export function isAuthenticated() {
  return Boolean(accessToken)
}

export function getAccessTokenSubject(token: string | null) {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const decoded = JSON.parse(atob(padded)) as { sub?: unknown }
    return typeof decoded.sub === 'string' ? decoded.sub : null
  } catch {
    return null
  }
}

function getStorage() {
  return typeof window === 'undefined' ? null : window.sessionStorage
}

export function getStoredAuthProfile(userUuid: string) {
  const serialized = getStorage()?.getItem(AUTH_PROFILE_KEY)
  if (!serialized) return null
  try {
    const profile = JSON.parse(serialized) as StoredAuthProfile
    return profile.userUuid === userUuid ? profile.user : null
  } catch {
    return null
  }
}

export function setStoredAuthProfile(user: import('./types').AuthUser) {
  getStorage()?.setItem(AUTH_PROFILE_KEY, JSON.stringify({ userUuid: user.user_uuid, user }))
}

export function clearStoredAuthProfile() {
  getStorage()?.removeItem(AUTH_PROFILE_KEY)
}
