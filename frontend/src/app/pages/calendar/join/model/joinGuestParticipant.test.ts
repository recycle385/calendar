import { beforeEach, describe, expect, it, vi } from 'vitest'

import { enterGuestParticipant } from '../../../../../domains/participant'
import { ApiError } from '../../../../../shared/api/httpClient'
import { joinGuestParticipant } from './joinGuestParticipant'

vi.mock('../../../../../domains/participant', () => ({
  enterGuestParticipant: vi.fn(),
}))

const participant = {
  uuid: 'participant-1',
  nickname: '게스트',
  color_code: '#FF0000',
  joined_at: '2026-09-15T00:00:00.000Z',
}

describe('게스트 캘린더 참여', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('기존 게스트면 입력한 정보로 다시 참여한다', async () => {
    vi.mocked(enterGuestParticipant).mockResolvedValue({
      message: '로그인 성공',
      participant: { ...participant, role: 'guest' },
      participantToken: 'existing-token',
    })

    const result = await joinGuestParticipant('calendar', '게스트', 'password')

    expect(result.participantToken).toBe('existing-token')
    expect(enterGuestParticipant).toHaveBeenCalledWith('calendar', {
      nickname: '게스트',
      password: 'password',
    })
  })

  it('등록되지 않은 게스트면 신규 참가자로 등록한다', async () => {
    vi.mocked(enterGuestParticipant).mockResolvedValue({
      message: '참가자 등록이 완료되었습니다',
      participant: { ...participant, role: 'guest' },
      participantToken: 'new-token',
    })

    const result = await joinGuestParticipant('calendar', '게스트', 'password')

    expect(enterGuestParticipant).toHaveBeenCalledWith('calendar', {
      nickname: '게스트',
      password: 'password',
    })
    expect(result.participantToken).toBe('new-token')
  })

  it('기존 닉네임의 비밀번호가 틀리면 서버 인증 오류를 유지한다', async () => {
    const loginError = new ApiError(401, {
      success: false,
      message: '닉네임 또는 비밀번호가 일치하지 않습니다',
    })
    vi.mocked(enterGuestParticipant).mockRejectedValue(loginError)

    await expect(joinGuestParticipant('calendar', '게스트', 'wrong')).rejects.toBe(loginError)
  })

  it('일시적인 서버 오류를 그대로 전달한다', async () => {
    const error = new ApiError(503, { success: false, message: '일시적인 장애' })
    vi.mocked(enterGuestParticipant).mockRejectedValue(error)

    await expect(joinGuestParticipant('calendar', '게스트', 'password')).rejects.toBe(error)
    expect(enterGuestParticipant).toHaveBeenCalledTimes(1)
  })
})
