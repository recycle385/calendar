import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { participantKeys } from '../../domains/participant'
import { voteKeys } from '../../domains/vote'
import { refreshParticipantData, refreshVoteData } from './calendarCache'

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

  it('강퇴 성공 후 참여자·현황·개인 투표 캐시를 함께 갱신한다', async () => {
    const queryClient = new QueryClient()
    const slug = 'study'
    const participantUuid = 'host'
    queryClient.setQueryData(participantKeys.list(slug), {})
    queryClient.setQueryData(voteKeys.status(slug), {})
    queryClient.setQueryData(voteKeys.participant(slug, participantUuid), {})
    await refreshParticipantData(queryClient, slug, participantUuid)
    expect(queryClient.getQueryState(participantKeys.list(slug))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(voteKeys.status(slug))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(voteKeys.participant(slug, participantUuid))?.isInvalidated).toBe(true)
  })
})
