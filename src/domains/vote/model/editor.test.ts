import { describe, expect, it } from 'vitest'

import { initialVoteEditorState, voteEditorReducer } from './editor'

describe('voteEditorReducer', () => {
  it('저장 중 추가 편집을 막아 제출본과 화면 초안이 어긋나지 않는다', () => {
    let state = voteEditorReducer(initialVoteEditorState, { type: 'REMOTE_SYNC', draft: { '2026-09-10': 'available' } })
    state = voteEditorReducer(state, { type: 'SELECT', date: '2026-09-11', voteType: 'maybe' })
    const submittedDraft = state.draft
    state = voteEditorReducer(state, { type: 'SAVE_STARTED', draft: submittedDraft })
    state = voteEditorReducer(state, { type: 'SELECT', date: '2026-09-12', voteType: 'unavailable' })

    expect(state.draft).toEqual(submittedDraft)
    expect(state.draft['2026-09-12']).toBeUndefined()

    state = voteEditorReducer(state, { type: 'SAVE_SUCCEEDED' })
    expect(state.baseline).toEqual(submittedDraft)
    expect(state.isDirty).toBe(false)
  })

  it('저장 실패와 외부 갱신에도 현재 편집본을 유지한다', () => {
    let state = voteEditorReducer(initialVoteEditorState, { type: 'REMOTE_SYNC', draft: {} })
    state = voteEditorReducer(state, { type: 'SELECT', date: '2026-09-10', voteType: 'available' })
    state = voteEditorReducer(state, { type: 'SAVE_STARTED', draft: state.draft })
    state = voteEditorReducer(state, { type: 'SAVE_FAILED' })
    state = voteEditorReducer(state, { type: 'REMOTE_SYNC', draft: { '2026-09-11': 'maybe' } })

    expect(state.draft).toEqual({ '2026-09-10': 'available' })
    expect(state.hasConflict).toBe(true)
    expect(state.isDirty).toBe(true)
  })

  it('저장 중 받은 다른 서버 투표는 저장 성공 뒤에도 충돌로 유지한다', () => {
    let state = voteEditorReducer(initialVoteEditorState, { type: 'REMOTE_SYNC', draft: {} })
    state = voteEditorReducer(state, { type: 'SELECT', date: '2026-09-10', voteType: 'available' })
    const submittedDraft = state.draft
    state = voteEditorReducer(state, { type: 'SAVE_STARTED', draft: submittedDraft })
    state = voteEditorReducer(state, { type: 'REMOTE_SYNC', draft: { '2026-09-11': 'maybe' } })
    state = voteEditorReducer(state, { type: 'SAVE_SUCCEEDED' })

    expect(state.baseline).toEqual(submittedDraft)
    expect(state.draft).toEqual(submittedDraft)
    expect(state.remoteDraft).toEqual({ '2026-09-11': 'maybe' })
    expect(state.hasConflict).toBe(true)
    expect(state.isSaving).toBe(false)
  })
})
