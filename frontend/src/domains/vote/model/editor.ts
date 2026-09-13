import type { DateVoteStatus, ParticipantVoteRecord, VoteInput, VoteType } from './types'

export type VoteDraft = Record<string, VoteType>

export interface VoteEditorState {
  sourceKey: string | null
  baseline: VoteDraft
  draft: VoteDraft
  remoteDraft: VoteDraft | null
  isDirty: boolean
  isSaving: boolean
  hasConflict: boolean
  removedDateCount: number
  submittedDraft: VoteDraft | null
}

export type VoteEditorAction =
  | { type: 'RESET' }
  | { type: 'SYNC_SOURCE'; sourceKey: string; remoteDraft: VoteDraft | null; enabledDates: Set<string> | null }
  | { type: 'REMOTE_SYNC'; draft: VoteDraft }
  | { type: 'RELOAD_REMOTE' }
  | { type: 'SELECT'; date: string; voteType: VoteType }
  | { type: 'CLEAR_ALL' }
  | { type: 'OPTIONS_CHANGED'; enabledDates: Set<string> }
  | { type: 'SAVE_STARTED'; draft: VoteDraft }
  | { type: 'SAVE_SUCCEEDED' }
  | { type: 'SAVE_FAILED' }

export const initialVoteEditorState: VoteEditorState = {
  sourceKey: null,
  baseline: {},
  draft: {},
  remoteDraft: null,
  isDirty: false,
  isSaving: false,
  hasConflict: false,
  removedDateCount: 0,
  submittedDraft: null,
}

export function createVoteEditorState(sourceKey: string, remoteDraft: VoteDraft | null): VoteEditorState {
  if (!remoteDraft) return { ...initialVoteEditorState, sourceKey }
  return {
    ...initialVoteEditorState,
    sourceKey,
    baseline: remoteDraft,
    draft: remoteDraft,
  }
}

export function createVoteDraft(
  votes: Array<Pick<ParticipantVoteRecord, 'date_value' | 'vote_type'>>,
  enabledDates: Set<string>,
) {
  return Object.fromEntries(votes
    .map((vote) => [vote.date_value.slice(0, 10), vote.vote_type] as const)
    .filter(([date]) => enabledDates.has(date)))
}

export function serializeVoteDraft(draft: VoteDraft, enabledDates: Set<string>): VoteInput[] {
  return Object.entries(draft)
    .filter(([date]) => enabledDates.has(date))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, voteType]) => ({ date, voteType }))
}

export function areVoteDraftsEqual(left: VoteDraft, right: VoteDraft) {
  const leftEntries = Object.entries(left).sort(([a], [b]) => a.localeCompare(b))
  const rightEntries = Object.entries(right).sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify(leftEntries) === JSON.stringify(rightEntries)
}

export function canSaveVoteEditor(state: VoteEditorState) {
  return !state.isSaving && (state.isDirty || state.hasConflict)
}

export function hasVoteEditorSourceData(
  voteStatus: DateVoteStatus[] | undefined,
  ownVotes: ParticipantVoteRecord[] | undefined,
) {
  return voteStatus !== undefined && ownVotes !== undefined
}

export function voteEditorReducer(state: VoteEditorState, action: VoteEditorAction): VoteEditorState {
  switch (action.type) {
    case 'RESET':
      return initialVoteEditorState
    case 'SYNC_SOURCE': {
      if (state.sourceKey !== action.sourceKey) {
        return createVoteEditorState(action.sourceKey, action.remoteDraft)
      }

      const remotelySynced = action.remoteDraft
        ? voteEditorReducer(state, { type: 'REMOTE_SYNC', draft: action.remoteDraft })
        : state
      return action.enabledDates
        ? voteEditorReducer(remotelySynced, { type: 'OPTIONS_CHANGED', enabledDates: action.enabledDates })
        : remotelySynced
    }
    case 'REMOTE_SYNC':
      if (state.isDirty || state.isSaving || state.hasConflict) {
        return areVoteDraftsEqual(state.baseline, action.draft)
          ? { ...state, remoteDraft: null, hasConflict: false }
          : { ...state, remoteDraft: action.draft, hasConflict: true }
      }
      return { ...state, baseline: action.draft, draft: action.draft, remoteDraft: null, hasConflict: false }
    case 'RELOAD_REMOTE':
      if (!state.remoteDraft || state.isSaving) return state
      return { ...state, baseline: state.remoteDraft, draft: state.remoteDraft, remoteDraft: null, isDirty: false, hasConflict: false, removedDateCount: 0 }
    case 'SELECT': {
      if (state.isSaving) return state
      const draft = { ...state.draft }
      if (draft[action.date] === action.voteType) delete draft[action.date]
      else draft[action.date] = action.voteType
      return { ...state, draft, isDirty: !areVoteDraftsEqual(state.baseline, draft), removedDateCount: 0 }
    }
    case 'CLEAR_ALL':
      if (state.isSaving) return state
      return { ...state, draft: {}, isDirty: Object.keys(state.baseline).length > 0, removedDateCount: 0 }
    case 'OPTIONS_CHANGED': {
      const draft = Object.fromEntries(Object.entries(state.draft).filter(([date]) => action.enabledDates.has(date)))
      const removedDateCount = Object.keys(state.draft).length - Object.keys(draft).length
      if (!removedDateCount) return state
      return { ...state, draft, isDirty: true, removedDateCount }
    }
    case 'SAVE_STARTED':
      if (state.isSaving) return state
      return { ...state, isSaving: true, submittedDraft: action.draft }
    case 'SAVE_SUCCEEDED': {
      const savedDraft = state.submittedDraft ?? state.draft
      const hasPendingConflict = Boolean(
        state.remoteDraft && !areVoteDraftsEqual(savedDraft, state.remoteDraft),
      )
      return {
        ...state,
        baseline: savedDraft,
        draft: savedDraft,
        remoteDraft: hasPendingConflict ? state.remoteDraft : null,
        isDirty: false,
        isSaving: false,
        hasConflict: hasPendingConflict,
        removedDateCount: 0,
        submittedDraft: null,
      }
    }
    case 'SAVE_FAILED':
      return { ...state, isSaving: false, submittedDraft: null }
  }
}
