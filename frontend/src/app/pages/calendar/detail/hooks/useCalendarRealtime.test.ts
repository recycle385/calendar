import { describe, expect, it } from 'vitest'

import { parseVoteUpdatedEvent } from './useCalendarRealtime'

describe('parseVoteUpdatedEvent', () => {
  it('투표 이벤트에서 최근 투표자 닉네임을 읽는다', () => {
    expect(parseVoteUpdatedEvent({ participantNickname: '민지', voteStatus: [] }))
      .toEqual({ participantNickname: '민지', voteStatus: [] })
  })

  it('닉네임이 없는 잘못된 이벤트는 무시한다', () => {
    expect(parseVoteUpdatedEvent({ voteStatus: [] })).toBeNull()
    expect(parseVoteUpdatedEvent({ participantNickname: '민지' })).toBeNull()
    expect(parseVoteUpdatedEvent(null)).toBeNull()
  })
})
