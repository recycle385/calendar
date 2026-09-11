import { describe, expect, it } from 'vitest'

import { rankVoteDates } from './ranking'
import type { DateVoteStatus, VoteType } from './types'

function dateStatus(date: string, votes: VoteType[]): DateVoteStatus {
  return {
    date_option_id: Number(date.slice(-2)),
    date_value: date,
    is_enabled: true,
    votes: votes.map((vote_type, index) => ({ participant_id: index, participant_nickname: `p${index}`, participant_color: '#000', vote_type })),
  }
}

describe('rankVoteDates', () => {
  it('가능 수, 미정 수, 날짜 오름차순 규칙을 모든 추천 화면에 제공한다', () => {
    const ranked = rankVoteDates([
      dateStatus('2026-09-12', ['available', 'maybe']),
      dateStatus('2026-09-10', ['available']),
      dateStatus('2026-09-11', ['available', 'maybe']),
      dateStatus('2026-09-09', ['unavailable']),
    ])

    expect(ranked.map(({ item }) => item.date_value)).toEqual([
      '2026-09-11',
      '2026-09-12',
      '2026-09-10',
      '2026-09-09',
    ])
  })
})
