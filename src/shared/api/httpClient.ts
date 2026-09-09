import type { ApiErrorBody } from '../types/api'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  token?: string | null
  signal?: AbortSignal
  headers?: HeadersInit
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

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

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const headers = new Headers(options.headers)
  const csrfToken = getCsrfToken()

  headers.set('Accept', 'application/json')

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
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
    throw new ApiError(response.status, data as ApiErrorBody | undefined)
  }

  return data as T
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
