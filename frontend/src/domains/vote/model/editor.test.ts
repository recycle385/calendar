import { describe, expect, it } from 'vitest'

import { canSaveVoteEditor, initialVoteEditorState, voteEditorReducer } from './editor'

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

  it('서버 투표가 저장 기준과 다시 같아지면 편집본을 유지하고 오래된 충돌을 해제한다', () => {
    const baseline = { '2026-09-10': 'available' as const }
    let state = voteEditorReducer(initialVoteEditorState, { type: 'REMOTE_SYNC', draft: baseline })
    state = voteEditorReducer(state, { type: 'SELECT', date: '2026-09-12', voteType: 'unavailable' })
    const editingDraft = state.draft
    state = voteEditorReducer(state, { type: 'REMOTE_SYNC', draft: { '2026-09-10': 'maybe' } })
    state = voteEditorReducer(state, { type: 'REMOTE_SYNC', draft: baseline })

    expect(state.draft).toEqual(editingDraft)
    expect(state.isDirty).toBe(true)
    expect(state.remoteDraft).toBeNull()
    expect(state.hasConflict).toBe(false)
  })

  it('충돌 중에는 편집 없이도 현재 편집본을 다시 저장할 수 있고 저장 중에는 중복 제출을 막는다', () => {
    let state = voteEditorReducer(initialVoteEditorState, { type: 'REMOTE_SYNC', draft: {} })
    state = voteEditorReducer(state, { type: 'SELECT', date: '2026-09-10', voteType: 'available' })
    state = voteEditorReducer(state, { type: 'SAVE_STARTED', draft: state.draft })
    state = voteEditorReducer(state, { type: 'REMOTE_SYNC', draft: { '2026-09-10': 'maybe' } })
    state = voteEditorReducer(state, { type: 'SAVE_SUCCEEDED' })

    expect(state.isDirty).toBe(false)
    expect(state.hasConflict).toBe(true)
    expect(canSaveVoteEditor(state)).toBe(true)

    state = voteEditorReducer(state, { type: 'SAVE_STARTED', draft: state.draft })
    expect(canSaveVoteEditor(state)).toBe(false)
  })
})
