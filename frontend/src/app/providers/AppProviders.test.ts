import { describe, expect, it } from 'vitest'

import { ApiError } from '../../shared/api/httpClient'
import { shouldRetryQuery } from './AppProviders'

describe('shouldRetryQuery', () => {
  it('요청 제한 응답은 추가 요청을 만들지 않는다', () => {
    expect(shouldRetryQuery(0, new ApiError(429))).toBe(false)
  })

  it('일시적인 일반 오류는 한 번만 재시도한다', () => {
    expect(shouldRetryQuery(0, new Error('temporary'))).toBe(true)
    expect(shouldRetryQuery(1, new Error('temporary'))).toBe(false)
  })
})
