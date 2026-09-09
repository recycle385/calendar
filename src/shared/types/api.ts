export interface ApiErrorBody {
  success?: false
  message?: string
  code?: string
  details?: unknown
}

export interface DefaultResponse {
  message: string
}
