import { useEffect, useMemo, useReducer } from 'react'

import {
  createVoteDraft,
  createVoteEditorState,
  hasVoteEditorSourceData,
  voteEditorReducer,
} from '../model/editor'
import type { DateVoteStatus, ParticipantVoteRecord } from '../model/types'

interface VoteEditorSource {
  sourceKey: string
  voteStatus?: DateVoteStatus[]
  ownVotes?: ParticipantVoteRecord[]
}

export function useVoteEditor({ sourceKey, voteStatus, ownVotes }: VoteEditorSource) {
  const enabledDates = useMemo(
    () => voteStatus?.filter((item) => item.is_enabled) ?? [],
    [voteStatus],
  )
  const enabledDateSet = useMemo(
    () => new Set(enabledDates.map((item) => item.date_value.slice(0, 10))),
    [enabledDates],
  )
  const sourceDataReady = hasVoteEditorSourceData(voteStatus, ownVotes)
  const remoteDraft = useMemo(
    () => sourceDataReady ? createVoteDraft(ownVotes!, enabledDateSet) : null,
    [enabledDateSet, ownVotes, sourceDataReady],
  )
  const remoteSignature = remoteDraft
    ? JSON.stringify(Object.entries(remoteDraft).sort(([a], [b]) => a.localeCompare(b)))
    : null
  const enabledSignature = [...enabledDateSet].sort().join('|')
  const [storedState, dispatch] = useReducer(
    voteEditorReducer,
    createVoteEditorState(sourceKey, remoteDraft),
  )

  useEffect(() => {
    dispatch({
      type: 'SYNC_SOURCE',
      sourceKey,
      remoteDraft,
      enabledDates: voteStatus ? enabledDateSet : null,
    })
  }, [enabledSignature, remoteSignature, sourceKey])

  const state = storedState.sourceKey === sourceKey
    ? storedState
    : createVoteEditorState(sourceKey, remoteDraft)

  return { state, dispatch, enabledDates, enabledDateSet, sourceDataReady }
}
