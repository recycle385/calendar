import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { participantKeys } from '../../domains/participant'
import { voteKeys, type GetVoteStatusResponse } from '../../domains/vote'
import { applyRealtimeVoteData, refreshParticipantData, refreshVoteData } from './calendarCache'

describe('calendar cache refresh', () => {
  it('소켓 연결 여부와 무관하게 투표 저장 후 관련 캐시를 모두 stale 처리한다', async () => {
    const queryClient = new QueryClient()
    const slug = 'study'
    const participantUuid = 'participant-1'
    queryClient.setQueryData(voteKeys.status(slug), {})
    queryClient.setQueryData(voteKeys.participant(slug, participantUuid), {})
    queryClient.setQueryData(participantKeys.list(slug), {})
    await refreshVoteData(queryClient, slug, participantUuid)
    expect(queryClient.getQueryState(voteKeys.status(slug))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(voteKeys.participant(slug, participantUuid))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(participantKeys.list(slug))?.isInvalidated).toBe(true)
  })

  it('강퇴 성공 후 참여자와 전체 현황만 갱신하고 개인 투표는 유지한다', async () => {
    const queryClient = new QueryClient()
    const slug = 'study'
    const participantUuid = 'host'
    queryClient.setQueryData(participantKeys.list(slug), {})
    queryClient.setQueryData(voteKeys.status(slug), {})
    queryClient.setQueryData(voteKeys.participant(slug, participantUuid), {})
    await refreshParticipantData(queryClient, slug)
    expect(queryClient.getQueryState(participantKeys.list(slug))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(voteKeys.status(slug))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(voteKeys.participant(slug, participantUuid))?.isInvalidated).toBe(false)
  })

  it('실시간 투표 데이터는 전체 현황에 직접 반영하고 필요한 참여자 목록만 갱신한다', async () => {
    const queryClient = new QueryClient()
    const slug = 'study'
    const participantUuid = 'participant-1'
    const current: GetVoteStatusResponse = {
      calendar: {
        slug,
        title: '스터디',
        start_date: '2026-09-20',
        end_date: '2026-09-21',
        is_closed: false,
      },
      voteStatus: [],
    }
    const nextVoteStatus = [{
      date_option_id: 1,
      date_value: '2026-09-20',
      is_enabled: true,
      votes: [],
    }]
    queryClient.setQueryData(voteKeys.status(slug), current)
    queryClient.setQueryData(voteKeys.participant(slug, participantUuid), {})
    queryClient.setQueryData(participantKeys.list(slug), {})

    await applyRealtimeVoteData(queryClient, slug, nextVoteStatus)

    expect(queryClient.getQueryData<GetVoteStatusResponse>(voteKeys.status(slug))?.voteStatus)
      .toEqual(nextVoteStatus)
    expect(queryClient.getQueryState(voteKeys.status(slug))?.isInvalidated).toBe(false)
    expect(queryClient.getQueryState(participantKeys.list(slug))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(voteKeys.participant(slug, participantUuid))?.isInvalidated).toBe(false)
  })
})
