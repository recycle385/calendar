import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, configureMainAuth } from '../../../shared/api/httpClient'
import { isParticipantReentryRequiredError, runParticipantRequest } from './authenticatedRequest'
import { getParticipantSession, setParticipantSession } from './session'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const originalWindow = globalThis.window

beforeEach(() => {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { sessionStorage: new MemoryStorage() } })
})

afterEach(() => {
  configureMainAuth(null)
  vi.unstubAllGlobals()
  Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow })
})

describe('runParticipantRequest', () => {
  it('회원 Participant Token의 401은 Main 기반 재입장 후 원 요청을 한 번 재시도한다', async () => {
    const session = { participantToken: 'expired-participant', participantUuid: 'participant-1', linkedUserUuid: 'user-1' }
    setParticipantSession('study', session)
    configureMainAuth({
      getAccessToken: () => 'main-token',
      getSessionSnapshot: () => ({ userUuid: 'user-1', sessionVersion: 1, accessToken: 'main-token' }),
      refreshAccessToken: vi.fn(),
      onAuthExpired: vi.fn(),
    })
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      message: 'ok',
      participantToken: 'fresh-participant',
      participant: { uuid: 'participant-1', nickname: '회원', color_code: '#000', joined_at: '2026-01-01' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))
    const request = vi.fn(async (token: string) => {
      if (token === 'expired-participant') throw new ApiError(401, { success: false })
      return token
    })

    const result = await runParticipantRequest({
      slug: 'study',
      session,
      currentUserUuid: 'user-1',
      mainAccessToken: 'main-token',
      request,
    })

    expect(result).toBe('fresh-participant')
    expect(request).toHaveBeenCalledTimes(2)
    expect(getParticipantSession('study')?.participantToken).toBe('fresh-participant')
  })

  it('게스트 Participant Token의 401은 Main refresh 없이 세션을 정리하고 재입장을 요구한다', async () => {
    const session = { participantToken: 'expired-guest', participantUuid: 'guest-1', linkedUserUuid: null }
    setParticipantSession('study', session)

    const error = await runParticipantRequest({
      slug: 'study',
      session,
      currentUserUuid: null,
      mainAccessToken: null,
      request: async () => { throw new ApiError(401, { success: false }) },
    }).catch((caught: unknown) => caught)

    expect(isParticipantReentryRequiredError(error)).toBe(true)
    expect(getParticipantSession('study')).toBeNull()
  })
})
