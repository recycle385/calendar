import type { ApiErrorBody } from '../types/api'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  token?: string | null
  auth?: 'none' | 'main' | 'participant'
  signal?: AbortSignal
  headers?: HeadersInit
}

interface MainAuthController {
  getAccessToken: () => string | null
  getSessionSnapshot: () => MainAuthSessionSnapshot
  refreshAccessToken: () => Promise<string>
  onAuthExpired: () => void
}

export interface MainAuthSessionSnapshot {
  userUuid: string | null
  sessionVersion: number
  accessToken: string | null
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'
let mainAuthController: MainAuthController | null = null
let mainRefreshInFlight: { session: MainAuthSessionSnapshot; promise: Promise<string> } | null = null

export class AuthSessionChangedError extends Error {
  constructor() {
    super('요청 중 로그인 계정이 변경되어 작업을 중단했습니다.')
    this.name = 'AuthSessionChangedError'
  }
}

export function configureMainAuth(controller: MainAuthController | null) {
  mainAuthController = controller
  if (!controller) mainRefreshInFlight = null
}

export class ApiError extends Error {
  readonly status: number
  readonly body?: ApiErrorBody

  constructor(status: number, body?: ApiErrorBody) {
    super(body?.message || `API 요청에 실패했습니다. (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function getCsrfToken() {
  if (typeof document === 'undefined') return null

  return (
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1] ?? null
  )
}

function isSameMainSession(left: MainAuthSessionSnapshot, right: MainAuthSessionSnapshot) {
  return left.sessionVersion === right.sessionVersion && left.userUuid === right.userUuid
}

async function refreshMainAccessToken(requestSession: MainAuthSessionSnapshot) {
  if (!mainAuthController) throw new Error('Main 인증 갱신 핸들러가 설정되지 않았습니다.')
  if (!mainRefreshInFlight || !isSameMainSession(mainRefreshInFlight.session, requestSession)) {
    const controller = mainAuthController
    const promise = controller.refreshAccessToken()
      .catch((error) => {
        if (isApiError(error) && error.status === 401
          && isSameMainSession(requestSession, controller.getSessionSnapshot())) {
          controller.onAuthExpired()
        }
        throw error
      })
      .finally(() => {
        if (mainRefreshInFlight?.promise === promise) mainRefreshInFlight = null
      })
    mainRefreshInFlight = { session: requestSession, promise }
  }
  return mainRefreshInFlight.promise
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const requestSession = options.auth === 'main' && mainAuthController
    ? mainAuthController.getSessionSnapshot()
    : null
  return executeRequest<T>(path, options, false, requestSession)
}

async function executeRequest<T>(
  path: string,
  options: RequestOptions,
  hasRetried: boolean,
  requestSession: MainAuthSessionSnapshot | null,
): Promise<T> {
  const method = options.method ?? 'GET'
  const auth = options.auth ?? 'none'
  const headers = new Headers(options.headers)
  const csrfToken = getCsrfToken()
  const token = auth === 'main'
    ? mainAuthController?.getAccessToken() ?? options.token
    : options.token

  headers.set('Accept', 'application/json')

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers.set('X-CSRF-Token', decodeURIComponent(csrfToken))
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json')
    ? ((await response.json()) as unknown)
    : undefined

  if (!response.ok) {
    const error = new ApiError(response.status, data as ApiErrorBody | undefined)

    if (response.status === 401 && auth === 'main' && !hasRetried && mainAuthController) {
      const currentSession = mainAuthController.getSessionSnapshot()
      if (!requestSession || !isSameMainSession(requestSession, currentSession)) {
        throw new AuthSessionChangedError()
      }

      if (currentSession.accessToken === token) {
        await refreshMainAccessToken(requestSession)
      }

      if (!isSameMainSession(requestSession, mainAuthController.getSessionSnapshot())) {
        throw new AuthSessionChangedError()
      }
      return executeRequest<T>(path, options, true, requestSession)
    }

    throw error
  }

  return data as T
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
