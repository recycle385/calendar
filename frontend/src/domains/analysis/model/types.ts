export interface AnalyzeVoteRequest {
  question: string
}

export interface AnalyzeVoteResponse {
  answer: string
  fallbackUsed: boolean
  result: unknown | null
}
