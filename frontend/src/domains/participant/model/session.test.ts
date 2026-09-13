import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  getParticipantSession,
  isLinkedMemberParticipantSession,
  isParticipantSessionUsable,
  removeParticipantToken,
  removeParticipantSessionsExceptUser,
  setParticipantSession,
  subscribeParticipantSession,
} from './session'

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
  Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow })
})

describe('Participant 세션 회원 격리', () => {
  it('다른 계정 로그인 시 이전 회원 세션만 제거하고 현재 회원과 게스트 세션은 유지한다', () => {
    setParticipantSession('old-member', { participantToken: 'old', participantUuid: 'p-old', linkedUserUuid: 'user-a' })
    setParticipantSession('current-member', { participantToken: 'current', participantUuid: 'p-current', linkedUserUuid: 'user-b' })
    setParticipantSession('guest', { participantToken: 'guest', participantUuid: 'p-guest', linkedUserUuid: null })

    const removed = removeParticipantSessionsExceptUser('user-b')

    expect(removed).toEqual([{ slug: 'old-member', participantUuid: 'p-old' }])
    expect(getParticipantSession('old-member')).toBeNull()
    expect(getParticipantSession('current-member')).not.toBeNull()
    expect(getParticipantSession('guest')).not.toBeNull()
  })

  it('회원 연결 세션은 동일 UUID에서만 사용하고 게스트 세션은 계정과 독립적이다', () => {
    const member = { participantToken: 'member', participantUuid: 'p-member', linkedUserUuid: 'user-a' }
    const guest = { participantToken: 'guest', participantUuid: 'p-guest', linkedUserUuid: null }

    expect(isParticipantSessionUsable(member, 'user-a')).toBe(true)
    expect(isParticipantSessionUsable(member, 'user-b')).toBe(false)
    expect(isParticipantSessionUsable(guest, 'user-b')).toBe(true)
  })

  it('소유 계정을 알 수 없는 예전 세션은 새 로그인에서 제거한다', () => {
    setParticipantSession('legacy', { participantToken: 'legacy', participantUuid: 'p-legacy' })
    removeParticipantSessionsExceptUser('user-b')
    expect(getParticipantSession('legacy')).toBeNull()
  })

  it('실제 회원 UUID가 연결된 세션만 회원 인증 복원 대상이다', () => {
    expect(isLinkedMemberParticipantSession(null)).toBe(false)
    expect(isLinkedMemberParticipantSession({ participantToken: 'legacy', participantUuid: 'p-legacy' })).toBe(false)
    expect(isLinkedMemberParticipantSession({ participantToken: 'guest', participantUuid: 'p-guest', linkedUserUuid: null })).toBe(false)
    expect(isLinkedMemberParticipantSession({ participantToken: 'member', participantUuid: 'p-member', linkedUserUuid: 'user-1' })).toBe(true)
  })

  it('세션 저장과 제거를 구독자에게 알린다', () => {
    const changes: string[] = []
    const unsubscribe = subscribeParticipantSession('calendar', () => changes.push('changed'))

    setParticipantSession('calendar', { participantToken: 'token', participantUuid: 'participant', linkedUserUuid: null })
    removeParticipantToken('calendar')
    unsubscribe()
    setParticipantSession('calendar', { participantToken: 'next', participantUuid: 'next-participant', linkedUserUuid: null })

    expect(changes).toEqual(['changed', 'changed'])
  })
})
