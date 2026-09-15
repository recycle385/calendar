import { afterEach, describe, expect, it, vi } from 'vitest'

import { getParticipantReconciliation, reconcileParticipant } from './participantApi'

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('참여 정보 정리 API', () => {
  it('Main 토큰과 게스트 참가자 토큰을 서로 다른 헤더로 보낸다', async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.get('Authorization')).toBe('Bearer main-token')
      expect(headers.get('X-Participant-Token')).toBe('guest-token')
      return jsonResponse({ state: 'claimable' })
    })
    vi.stubGlobal('fetch', fetchMock)

    await getParticipantReconciliation('calendar-slug', 'guest-token', 'main-token')

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      '/calendars/calendar-slug/participants/reconciliation',
    )
  })

  it('선택한 기록 처리 방식을 정리 요청 본문에 보낸다', async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      expect(init?.method).toBe('POST')
      expect(JSON.parse(String(init?.body))).toEqual({ action: 'use-guest-votes' })
      return jsonResponse({ participantToken: 'next-token' })
    })
    vi.stubGlobal('fetch', fetchMock)

    await reconcileParticipant(
      'calendar-slug',
      'guest-token',
      'main-token',
      'use-guest-votes',
    )

    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
