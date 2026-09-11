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
  refreshAccessToken: () => Promise<string>
  onAuthExpired: () => void
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'
let mainAuthController: MainAuthController | null = null
let mainRefreshInFlight: Promise<string> | null = null

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

async function refreshMainAccessToken() {
  if (!mainAuthController) throw new Error('Main 인증 갱신 핸들러가 설정되지 않았습니다.')
  if (!mainRefreshInFlight) {
    const controller = mainAuthController
    mainRefreshInFlight = controller.refreshAccessToken()
      .catch((error) => {
        if (isApiError(error) && error.status === 401) controller.onAuthExpired()
        throw error
      })
      .finally(() => {
        mainRefreshInFlight = null
      })
  }
  return mainRefreshInFlight
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return executeRequest<T>(path, options, false)
}

async function executeRequest<T>(path: string, options: RequestOptions, hasRetried: boolean): Promise<T> {
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
      try {
        await refreshMainAccessToken()
      } catch (refreshError) {
        throw refreshError
      }
      return executeRequest<T>(path, options, true)
    }

    throw error
  }

  return data as T
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
