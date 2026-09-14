import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../../../../shared/api/httpClient'
import { loginParticipant, registerParticipant } from '../../../../../domains/participant'
import { joinMemberParticipant } from './joinMemberParticipant'

vi.mock('../../../../../domains/participant', () => ({
  loginParticipant: vi.fn(),
  registerParticipant: vi.fn(),
}))

const participant = {
  uuid: 'participant-1',
  nickname: '회원',
  color_code: '#FF0000',
  joined_at: '2026-09-14T00:00:00.000Z',
}

describe('현재 계정으로 캘린더 참여', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('이미 참여한 회원이면 기존 참가 세션을 재발급한다', async () => {
    vi.mocked(loginParticipant).mockResolvedValue({
      message: '로그인 성공',
      participant,
      participantToken: 'existing-token',
    })

    const result = await joinMemberParticipant('calendar', '회원', 'main-token')

    expect(result.participantToken).toBe('existing-token')
    expect(registerParticipant).not.toHaveBeenCalled()
  })

  it('등록되지 않은 회원이면 신규 참가자로 등록한다', async () => {
    vi.mocked(loginParticipant).mockRejectedValue(new ApiError(404, {
      success: false,
      code: 'USER_NOT_FOUND',
      message: '등록되지 않은 참가자. 등록 필요',
    }))
    vi.mocked(registerParticipant).mockResolvedValue({
      message: '참가자 등록이 완료되었습니다',
      participant: { ...participant, role: 'guest' },
      participantToken: 'new-token',
    })

    const result = await joinMemberParticipant('calendar', ' 회원 ', 'main-token')

    expect(registerParticipant).toHaveBeenCalledWith(
      'calendar',
      { nickname: '회원' },
      'main-token',
    )
    expect(result.participantToken).toBe('new-token')
  })

  it('참가자 없음이 아닌 오류는 신규 등록으로 숨기지 않는다', async () => {
    const error = new ApiError(503, { success: false, message: '일시적인 장애' })
    vi.mocked(loginParticipant).mockRejectedValue(error)

    await expect(joinMemberParticipant('calendar', '회원', 'main-token')).rejects.toBe(error)
    expect(registerParticipant).not.toHaveBeenCalled()
  })
})
