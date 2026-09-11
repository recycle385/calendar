import type { DateVoteStatus } from './types'

export interface RankedVoteDate {
  item: DateVoteStatus
  available: number
  maybe: number
  unavailable: number
}

export function rankVoteDates(voteStatus: DateVoteStatus[]): RankedVoteDate[] {
  return voteStatus
    .filter((item) => item.is_enabled)
    .map((item) => ({
      item,
      available: item.votes.filter((vote) => vote.vote_type === 'available').length,
      maybe: item.votes.filter((vote) => vote.vote_type === 'maybe').length,
      unavailable: item.votes.filter((vote) => vote.vote_type === 'unavailable').length,
    }))
    .sort((left, right) =>
      right.available - left.available
      || right.maybe - left.maybe
      || left.item.date_value.localeCompare(right.item.date_value),
    )
}
