import { CalendarDays, Check, RotateCcw } from 'lucide-react'
import { useState, type Dispatch } from 'react'

import {
  canSaveVoteEditor,
  serializeVoteDraft,
} from '../model/editor'
import type { VoteEditorAction, VoteEditorState } from '../model/editor'
import type { DateVoteStatus, VoteInput, VoteType } from '../model/types'
import { VoteCalendar } from './VoteCalendar'
import { VoteToolSelector } from './VoteToolSelector'

interface VotePanelProps {
  isClosed: boolean
  enabledDates: DateVoteStatus[]
  enabledDateSet: Set<string>
  participantsCount: number
  recentVoterNickname: string | null
  selectedDate: string
  sourceDataReady: boolean
  loading: boolean
  loadError: boolean
  refetchError: boolean
  state: VoteEditorState
  dispatch: Dispatch<VoteEditorAction>
  onRetry: () => void
  onSelectDate: (date: string) => void
  onSubmit: (votes: VoteInput[]) => Promise<unknown>
}

export function VotePanel({ isClosed, enabledDates, enabledDateSet, participantsCount, recentVoterNickname, selectedDate, sourceDataReady, loading, loadError, refetchError, state, dispatch, onRetry, onSelectDate, onSubmit }: VotePanelProps) {
  const [tool, setTool] = useState<VoteType>('available')
  const [saveError, setSaveError] = useState<string | null>(null)

  async function saveVotes() {
    if (state.isSaving || !sourceDataReady) return
    setSaveError(null)
    const submittedDraft = Object.fromEntries(serializeVoteDraft(state.draft, enabledDateSet).map((vote) => [vote.date, vote.voteType]))
    dispatch({ type: 'SAVE_STARTED', draft: submittedDraft })
    try {
      await onSubmit(serializeVoteDraft(submittedDraft, enabledDateSet))
      dispatch({ type: 'SAVE_SUCCEEDED' })
    } catch (error) {
      dispatch({ type: 'SAVE_FAILED' })
      if (error instanceof Error && error.name === 'ParticipantReentryRequiredError') {
        return
      }
      setSaveError('투표를 저장하지 못했어요. 편집 내용은 유지했으니 다시 시도해주세요.')
    }
  }

  if (loading) return <section className="workspace-panel calendar-feedback">내 투표 정보를 불러오는 중이에요.</section>
  if (loadError || !sourceDataReady) return <section className="workspace-panel calendar-feedback"><CalendarDays size={32} /><h2>내 투표 정보를 불러오지 못했어요.</h2><p>기존 투표를 보호하기 위해 편집과 저장을 잠시 막았어요.</p><button className="button button-secondary" type="button" onClick={onRetry}>다시 시도</button></section>
  if (isClosed) return <section className="workspace-panel calendar-feedback"><CalendarDays size={32} /><h2>투표가 마감되었어요.</h2><p>{state.isDirty ? '다른 화면에서 투표가 마감되어 편집 중이던 변경은 저장되지 않았어요.' : '투표 현황에서 함께 고른 날짜를 확인할 수 있어요.'}</p></section>
  if (enabledDates.length === 0) return <section className="workspace-panel calendar-feedback"><CalendarDays size={32} /><h2>선택 가능한 날짜가 없어요.</h2><p>방장이 투표 기간을 조정하면 이곳에 표시돼요.</p></section>

  const selectedCount = Object.keys(state.draft).length

  return (
    <section className="workspace-panel vote-panel">
      <header className="vote-panel-heading">
        <div>
          <p className="eyebrow">DATE VOTE</p>
          <h2>우리, 언제 만날까요?</h2>
          <p>각자 가능한 날짜를 선택하면<br />모두의 응답이 실시간으로 반영돼요.</p>
        </div>
        <div className="vote-live-notice">
          <strong><i /> 실시간 반영 중</strong>
          <span>{recentVoterNickname ? `${recentVoterNickname}님이 투표했어요.` : selectedCount > 0 ? `${selectedCount}개 날짜를 선택했어요.` : '가능한 날짜를 선택해주세요.'}</span>
        </div>
      </header>

      {refetchError && <div className="vote-conflict-notice"><p>최신 투표를 다시 확인하지 못했어요. 불러온 내용과 편집본은 그대로 유지했습니다.</p><button type="button" onClick={onRetry}><RotateCcw size={14} /> 다시 확인</button></div>}
      {state.hasConflict && <div className="vote-conflict-notice"><p>다른 화면에서 내 투표가 변경됐어요. 현재 편집본은 그대로 유지했습니다.</p><button type="button" onClick={() => dispatch({ type: 'RELOAD_REMOTE' })}><RotateCcw size={14} /> 서버 내용 다시 불러오기</button></div>}
      {state.removedDateCount > 0 && <p className="vote-option-notice">투표 기간이 바뀌어 선택할 수 없게 된 {state.removedDateCount}개 날짜를 편집본에서 제외했어요.</p>}

      <VoteToolSelector disabled={state.isSaving} value={tool} onChange={setTool} />
      <VoteCalendar disabled={state.isSaving} draft={state.draft} enabledDates={enabledDates} participantsCount={participantsCount} selectedDate={selectedDate} tool={tool} dispatch={dispatch} onSelectDate={onSelectDate} />

      {saveError && <p className="form-error workspace-request-error">{saveError}</p>}
      <div className="vote-submit-row">
        <button className="vote-reset-button" type="button" disabled={state.isSaving} onClick={() => dispatch({ type: 'CLEAR_ALL' })}><RotateCcw size={14} /> 선택 초기화</button>
        <button className="button button-primary" type="button" disabled={!canSaveVoteEditor(state)} onClick={() => void saveVotes()}>{state.isSaving ? '저장 중…' : <><Check size={18} /> {state.hasConflict ? '현재 편집본으로 저장' : '투표 저장하기'}</>}</button>
      </div>
    </section>
  )
}
