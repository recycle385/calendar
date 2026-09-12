import { CalendarDays, Check, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useReducer, useState } from 'react'

import { formatDate } from '../../../shared/utils/format'
import {
  canSaveVoteEditor,
  createVoteDraft,
  initialVoteEditorState,
  serializeVoteDraft,
  voteEditorReducer,
} from '../model/editor'
import type { DateVoteStatus, ParticipantVoteRecord, VoteInput, VoteType } from '../model/types'

const VOTE_TOOL: Array<{ value: VoteType; label: string; className: string }> = [
  { value: 'available', label: '가능', className: 'is-available' },
  { value: 'maybe', label: '애매함', className: 'is-maybe' },
  { value: 'unavailable', label: '불가', className: 'is-unavailable' },
]

interface VotePanelProps {
  isClosed: boolean
  voteStatus: DateVoteStatus[]
  ownVotes: ParticipantVoteRecord[]
  loading: boolean
  onSubmit: (votes: VoteInput[]) => Promise<unknown>
  onReentryRequired: () => void
}

export function VotePanel({ isClosed, voteStatus, ownVotes, loading, onSubmit, onReentryRequired }: VotePanelProps) {
  const [tool, setTool] = useState<VoteType>('available')
  const [state, dispatch] = useReducer(voteEditorReducer, initialVoteEditorState)
  const [saveError, setSaveError] = useState<string | null>(null)
  const enabledDates = useMemo(() => voteStatus.filter((item) => item.is_enabled), [voteStatus])
  const enabledDateSet = useMemo(() => new Set(enabledDates.map((item) => item.date_value.slice(0, 10))), [enabledDates])
  const enabledSignature = [...enabledDateSet].sort().join('|')
  const remoteDraft = useMemo(() => createVoteDraft(ownVotes, enabledDateSet), [enabledDateSet, ownVotes])
  const remoteSignature = JSON.stringify(Object.entries(remoteDraft).sort(([a], [b]) => a.localeCompare(b)))

  useEffect(() => {
    dispatch({ type: 'REMOTE_SYNC', draft: remoteDraft })
  }, [remoteSignature])

  useEffect(() => {
    dispatch({ type: 'OPTIONS_CHANGED', enabledDates: enabledDateSet })
  }, [enabledSignature])

  useEffect(() => {
    if (!state.isDirty) return
    const warnBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [state.isDirty])

  async function saveVotes() {
    if (state.isSaving) return
    setSaveError(null)
    const submittedDraft = Object.fromEntries(serializeVoteDraft(state.draft, enabledDateSet).map((vote) => [vote.date, vote.voteType]))
    dispatch({ type: 'SAVE_STARTED', draft: submittedDraft })
    try {
      await onSubmit(serializeVoteDraft(submittedDraft, enabledDateSet))
      dispatch({ type: 'SAVE_SUCCEEDED' })
    } catch (error) {
      dispatch({ type: 'SAVE_FAILED' })
      if (error instanceof Error && error.name === 'ParticipantReentryRequiredError') {
        onReentryRequired()
        return
      }
      setSaveError('투표를 저장하지 못했어요. 편집 내용은 유지했으니 다시 시도해주세요.')
    }
  }

  if (loading) return <section className="workspace-panel calendar-feedback">내 투표 정보를 불러오는 중이에요.</section>
  if (isClosed) return <section className="workspace-panel calendar-feedback"><CalendarDays size={32} /><h2>투표가 마감되었어요.</h2><p>{state.isDirty ? '다른 화면에서 투표가 마감되어 편집 중이던 변경은 저장되지 않았어요.' : '투표 현황에서 함께 고른 날짜를 확인할 수 있어요.'}</p></section>
  if (enabledDates.length === 0) return <section className="workspace-panel calendar-feedback"><CalendarDays size={32} /><h2>선택 가능한 날짜가 없어요.</h2><p>방장이 투표 기간을 조정하면 이곳에 표시돼요.</p></section>

  return <section className="workspace-panel vote-panel">
    <div className="detail-panel-heading"><div><h2>날짜 투표</h2><p>가능한 날짜를 누르고 상태를 표시해주세요. 여러 날짜를 선택할 수 있어요.</p></div><span>{Object.keys(state.draft).length}개 선택</span></div>
    {state.hasConflict && <div className="vote-conflict-notice"><p>다른 화면에서 내 투표가 변경됐어요. 현재 편집본은 그대로 유지했습니다.</p><button type="button" onClick={() => dispatch({ type: 'RELOAD_REMOTE' })}><RotateCcw size={14} /> 서버 내용 다시 불러오기</button></div>}
    {state.removedDateCount > 0 && <p className="vote-option-notice">투표 기간이 바뀌어 선택할 수 없게 된 {state.removedDateCount}개 날짜를 편집본에서 제외했어요.</p>}
    <div className="vote-tools" aria-label="투표 상태 선택">{VOTE_TOOL.map((item) => <button key={item.value} type="button" disabled={state.isSaving} className={`${item.className}${tool === item.value ? ' is-selected' : ''}`} onClick={() => setTool(item.value)}><i />{item.label}</button>)}</div>
    <div className="vote-date-grid">{enabledDates.map((item) => { const date = item.date_value.slice(0, 10); const selected = state.draft[date]; return <button type="button" disabled={state.isSaving} className={`vote-date-cell${selected ? ` ${VOTE_TOOL.find((toolItem) => toolItem.value === selected)?.className}` : ''}`} key={date} onClick={() => dispatch({ type: 'SELECT', date, voteType: tool })}><span>{formatDate(date)}</span><strong>{selected ? VOTE_TOOL.find((toolItem) => toolItem.value === selected)?.label : '선택 안 함'}</strong>{selected && <small>같은 상태를 누르면 해제돼요</small>}</button> })}</div>
    {saveError && <p className="form-error workspace-request-error">{saveError}</p>}
    <div className="vote-submit-row"><button className="vote-reset-button" type="button" disabled={state.isSaving} onClick={() => dispatch({ type: 'CLEAR_ALL' })}><RotateCcw size={14} /> 선택 초기화</button><button className="button button-primary" type="button" disabled={!canSaveVoteEditor(state)} onClick={() => void saveVotes()}>{state.isSaving ? '저장 중…' : <><Check size={18} /> {state.hasConflict ? '현재 편집본으로 저장' : '투표 저장하기'}</>}</button></div>
  </section>
}
