import { describe, expect, it } from 'vitest'

import { getVoteOverview } from './overview'
import type { DateVoteStatus, VoteType } from './types'

function dateStatus(date: string, votes: Array<[number, VoteType]>): DateVoteStatus {
  return {
    date_option_id: Number(date.slice(-2)),
    date_value: date,
    is_enabled: true,
    votes: votes.map(([participant_id, vote_type]) => ({
      participant_id,
      participant_nickname: `참여자 ${participant_id}`,
      participant_color: '#000000',
      vote_type,
    })),
  }
}

describe('getVoteOverview', () => {
  it('여러 날짜에 투표한 참여자를 한 명으로 집계한다', () => {
    const overview = getVoteOverview([
      dateStatus('2026-09-15', [[1, 'available'], [2, 'maybe']]),
      dateStatus('2026-09-16', [[1, 'unavailable']]),
    ], 3)

    expect(overview.votedParticipants).toBe(2)
    expect(overview.participationPercent).toBe(67)
    expect(overview.leadingCandidate?.item.date_value).toBe('2026-09-15')
    expect(overview.decisionState).toBe('coordination')
  })

  it('전체 참여자가 가능한 후보가 있으면 전원 가능 상태로 표시한다', () => {
    const overview = getVoteOverview([
      dateStatus('2026-09-15', [[1, 'available'], [2, 'available']]),
    ], 2)

    expect(overview.decisionState).toBe('unanimous')
  })

  it('아직 투표한 사람이 없으면 투표 대기 상태로 표시한다', () => {
    const overview = getVoteOverview([dateStatus('2026-09-15', [])], 3)

    expect(overview).toMatchObject({
      votedParticipants: 0,
      participationPercent: 0,
      leadingCandidate: null,
      decisionState: 'waiting',
    })
  })
})
