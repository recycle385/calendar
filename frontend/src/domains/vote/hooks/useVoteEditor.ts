import { useEffect, useReducer } from 'react'

import { initialVoteEditorState, voteEditorReducer } from '../model/editor'

export function useVoteEditor(sourceKey: string) {
  const [state, dispatch] = useReducer(voteEditorReducer, initialVoteEditorState)

  useEffect(() => {
    dispatch({ type: 'RESET' })
  }, [sourceKey])

  return { state, dispatch }
}
