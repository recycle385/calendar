import { selectLeadingVoteDates, type RankedVoteDate } from './ranking'
import type { DateVoteStatus } from './types'

export type VoteDecisionState = 'waiting' | 'coordination' | 'unanimous'

export interface VoteOverview {
  votedParticipants: number
  participationPercent: number
  leadingCandidate: RankedVoteDate | null
  decisionState: VoteDecisionState
}

export function getVoteOverview(voteStatus: DateVoteStatus[], participantsCount: number): VoteOverview {
  const enabledStatus = voteStatus.filter((item) => item.is_enabled)
  const votedParticipantIds = new Set(
    enabledStatus.flatMap((item) => item.votes.map((vote) => vote.participant_id)),
  )
  const votedParticipants = votedParticipantIds.size
  const leadingCandidate = votedParticipants > 0
    ? selectLeadingVoteDates(enabledStatus, 1)[0] ?? null
    : null
  const participationPercent = participantsCount > 0
    ? Math.min(100, Math.round((votedParticipants / participantsCount) * 100))
    : 0

  let decisionState: VoteDecisionState = 'coordination'
  if (votedParticipants === 0) decisionState = 'waiting'
  else if (participantsCount > 0 && leadingCandidate?.available === participantsCount) decisionState = 'unanimous'

  return {
    votedParticipants,
    participationPercent,
    leadingCandidate,
    decisionState,
  }
}
