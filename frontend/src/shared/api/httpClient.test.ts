import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, apiRequest, AuthSessionChangedError, configureMainAuth } from './httpClient'

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
      getSessionSnapshot: () => ({ userUuid: 'user-1', sessionVersion: 1, accessToken: token }),
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
    configureMainAuth({
      getAccessToken: () => 'main-token',
      getSessionSnapshot: () => ({ userUuid: 'user-1', sessionVersion: 1, accessToken: 'main-token' }),
      refreshAccessToken,
      onAuthExpired: vi.fn(),
    })

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
    configureMainAuth({
      getAccessToken: () => 'expired',
      getSessionSnapshot: () => ({ userUuid: 'user-1', sessionVersion: 1, accessToken: 'expired' }),
      refreshAccessToken,
      onAuthExpired,
    })

    const results = await Promise.allSettled([
      apiRequest('/one', { auth: 'main' }),
      apiRequest('/two', { auth: 'main' }),
      apiRequest('/three', { auth: 'main' }),
    ])

    expect(results.every((result) => result.status === 'rejected')).toBe(true)
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(onAuthExpired).toHaveBeenCalledTimes(1)
  })

  it('공유 refresh가 503으로 실패하면 로그인 만료로 처리하지 않고 재시도 가능한 오류를 유지한다', async () => {
    const onAuthExpired = vi.fn()
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(401, { success: false })))
    configureMainAuth({
      getAccessToken: () => 'expired',
      getSessionSnapshot: () => ({ userUuid: 'user-1', sessionVersion: 1, accessToken: 'expired' }),
      refreshAccessToken: async () => { throw new ApiError(503, { success: false, message: 'temporary' }) },
      onAuthExpired,
    })

    await expect(apiRequest('/calendars', { auth: 'main' })).rejects.toMatchObject({ status: 503 })
    expect(onAuthExpired).not.toHaveBeenCalled()
  })

  it('요청 도중 계정이 바뀌면 새 계정 토큰으로 원 요청을 재전송하지 않는다', async () => {
    let session = { userUuid: 'user-a', sessionVersion: 1, accessToken: 'token-a' }
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => (
      jsonResponse(401, { success: false, message: 'expired' })
    ))
    vi.stubGlobal('fetch', fetchMock)
    configureMainAuth({
      getAccessToken: () => session.accessToken,
      getSessionSnapshot: () => session,
      refreshAccessToken: async () => {
        session = { userUuid: 'user-b', sessionVersion: 2, accessToken: 'token-b' }
        return session.accessToken
      },
      onAuthExpired: vi.fn(),
    })

    await expect(apiRequest('/calendars', {
      auth: 'main',
      method: 'POST',
      body: JSON.stringify({ title: 'A 계정 캘린더' }),
    })).rejects.toBeInstanceOf(AuthSessionChangedError)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe('Bearer token-a')
  })

  it('갱신 완료 뒤 늦게 도착한 이전 토큰의 401은 추가 refresh 없이 현재 토큰으로 재시도한다', async () => {
    let token = 'expired-token'
    let releaseSlowRequest: (() => void) | undefined
    const slowRequestGate = new Promise<void>((resolve) => { releaseSlowRequest = resolve })
    const refreshAccessToken = vi.fn(async () => {
      token = 'fresh-token'
      return token
    })
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const authorization = new Headers(init?.headers).get('Authorization')
      if (String(input).endsWith('/slow') && authorization === 'Bearer expired-token') {
        await slowRequestGate
        return jsonResponse(401, { success: false, message: 'expired' })
      }
      return authorization === 'Bearer expired-token'
        ? jsonResponse(401, { success: false, message: 'expired' })
        : jsonResponse(200, { value: 'ok' })
    })
    vi.stubGlobal('fetch', fetchMock)
    configureMainAuth({
      getAccessToken: () => token,
      getSessionSnapshot: () => ({ userUuid: 'user-1', sessionVersion: 1, accessToken: token }),
      refreshAccessToken,
      onAuthExpired: vi.fn(),
    })

    const slowRequest = apiRequest<{ value: string }>('/slow', { auth: 'main' })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const fastResult = await apiRequest<{ value: string }>('/fast', { auth: 'main' })
    releaseSlowRequest?.()
    const slowResult = await slowRequest

    expect(fastResult.value).toBe('ok')
    expect(slowResult.value).toBe('ok')
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })
})
