import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, apiRequest, configureMainAuth } from './httpClient'

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

afterEach(() => {
  configureMainAuth(null)
  vi.unstubAllGlobals()
})

describe('apiRequest Main 인증 갱신', () => {
  it('동시에 여러 요청이 401이어도 refresh를 한 번만 공유하고 각각 한 번 재시도한다', async () => {
    let token = 'expired-token'
    let refreshCount = 0
    const fetchMock = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const authorization = new Headers(init?.headers).get('Authorization')
      return authorization === 'Bearer expired-token'
        ? jsonResponse(401, { success: false, message: 'expired' })
        : jsonResponse(200, { value: 'ok' })
    })
    vi.stubGlobal('fetch', fetchMock)
    configureMainAuth({
      getAccessToken: () => token,
      refreshAccessToken: async () => {
        refreshCount += 1
        await new Promise((resolve) => setTimeout(resolve, 0))
        token = 'fresh-token'
        return token
      },
      onAuthExpired: vi.fn(),
    })

    const results = await Promise.all([
      apiRequest<{ value: string }>('/one', { auth: 'main' }),
      apiRequest<{ value: string }>('/two', { auth: 'main' }),
      apiRequest<{ value: string }>('/three', { auth: 'main' }),
    ])

    expect(results.map((result) => result.value)).toEqual(['ok', 'ok', 'ok'])
    expect(refreshCount).toBe(1)
    expect(fetchMock).toHaveBeenCalledTimes(6)
  })

  it('Participant 401은 Main refresh를 호출하지 않는다', async () => {
    const refreshAccessToken = vi.fn(async () => 'fresh-token')
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(401, { success: false })))
    configureMainAuth({ getAccessToken: () => 'main-token', refreshAccessToken, onAuthExpired: vi.fn() })

    await expect(apiRequest('/participant', { auth: 'participant', token: 'participant-token' })).rejects.toMatchObject({ status: 401 })
    expect(refreshAccessToken).not.toHaveBeenCalled()
  })

  it('공유 refresh가 401로 실패하면 인증 만료 처리를 한 번만 호출한다', async () => {
    const onAuthExpired = vi.fn()
    const refreshAccessToken = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
      throw new ApiError(401, { success: false })
    })
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(401, { success: false })))
    configureMainAuth({ getAccessToken: () => 'expired', refreshAccessToken, onAuthExpired })

    const results = await Promise.allSettled([
      apiRequest('/one', { auth: 'main' }),
      apiRequest('/two', { auth: 'main' }),
      apiRequest('/three', { auth: 'main' }),
    ])

    expect(results.every((result) => result.status === 'rejected')).toBe(true)
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(onAuthExpired).toHaveBeenCalledTimes(1)
  })
})
