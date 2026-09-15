import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { consumeAuthReturnPath, setAuthReturnPath } from './session'

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
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { sessionStorage: new MemoryStorage() },
  })
})

afterEach(() => {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow })
})

describe('로그인 완료 후 복귀 경로', () => {
  it('내부 캘린더 경로를 한 번만 돌려준다', () => {
    setAuthReturnPath('/c/calendar-slug?tab=vote')
    expect(consumeAuthReturnPath()).toBe('/c/calendar-slug?tab=vote')
    expect(consumeAuthReturnPath()).toBeNull()
  })

  it('외부 URL 형태의 경로는 저장하지 않는다', () => {
    setAuthReturnPath('//attacker.example/path')
    expect(consumeAuthReturnPath()).toBeNull()
  })
})
