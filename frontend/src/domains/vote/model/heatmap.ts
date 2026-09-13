export type VoteHeatLevel = 0 | 1 | 2 | 3 | 4

export function getAvailabilityHeatLevel(availableCount: number, participantsCount: number): VoteHeatLevel {
  if (availableCount <= 0 || participantsCount <= 0) return 0
  return Math.min(4, Math.ceil((availableCount / participantsCount) * 4)) as VoteHeatLevel
}
