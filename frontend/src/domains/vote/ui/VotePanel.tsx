import { CalendarDays, Check, RotateCcw } from 'lucide-react'
import { useState, type Dispatch } from 'react'

import {
  canSaveVoteEditor,
  serializeVoteDraft,
} from '../model/editor'
import type { VoteEditorAction, VoteEditorState } from '../model/editor'
import type { DateVoteStatus, VoteInput, VoteType } from '../model/types'
import { buttonClass, eyebrowClass, panelClass, primaryButtonClass, secondaryButtonClass } from '../../../shared/ui/styles'
import { VoteCalendar } from './VoteCalendar'
import { VoteToolSelector } from './VoteToolSelector'

interface VotePanelProps {
  isClosed: boolean
  enabledDates: DateVoteStatus[]
  enabledDateSet: Set<string>
  participantsCount: number
  voteNotification: {
    id: number
    nickname: string
  } | null
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

const feedbackClass = `${panelClass} grid min-h-[250px] place-content-center justify-items-center gap-3 p-9 text-center text-[#69809f]`

export function VotePanel({ isClosed, enabledDates, enabledDateSet, participantsCount, voteNotification, selectedDate, sourceDataReady, loading, loadError, refetchError, state, dispatch, onRetry, onSelectDate, onSubmit }: VotePanelProps) {
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

  if (loading) return <section className={feedbackClass}>내 투표 정보를 불러오는 중이에요.</section>
  if (loadError || !sourceDataReady) return <section className={feedbackClass}><CalendarDays size={32} /><h2 className="m-0 text-[22px] font-black text-[#19345d]">내 투표 정보를 불러오지 못했어요.</h2><p className="m-0 max-w-[430px] leading-[1.65]">기존 투표를 보호하기 위해 편집과 저장을 잠시 막았어요.</p><button className={`${buttonClass} ${secondaryButtonClass}`} type="button" onClick={onRetry}>다시 시도</button></section>
  if (isClosed) return <section className={feedbackClass}><CalendarDays size={32} /><h2 className="m-0 text-[22px] font-black text-[#19345d]">투표가 마감되었어요.</h2><p className="m-0 max-w-[430px] leading-[1.65]">{state.isDirty ? '다른 화면에서 투표가 마감되어 편집 중이던 변경은 저장되지 않았어요.' : '투표 현황에서 함께 고른 날짜를 확인할 수 있어요.'}</p></section>
  if (enabledDates.length === 0) return <section className={feedbackClass}><CalendarDays size={32} /><h2 className="m-0 text-[22px] font-black text-[#19345d]">선택 가능한 날짜가 없어요.</h2><p className="m-0 max-w-[430px] leading-[1.65]">방장이 투표 기간을 조정하면 이곳에 표시돼요.</p></section>

  return (
    <section className={`${panelClass} p-[25px] max-[800px]:p-5`}>
      <header className="mb-5 flex items-start justify-between gap-4 max-[800px]:flex-col max-[800px]:gap-3.5">
        <div>
          <p className={eyebrowClass}>DATE VOTE</p>
          <h2 className="mt-2 mb-1.5 text-[30px] font-black tracking-[-0.05em] text-[#19365e] max-[520px]:text-[25px]">우리, 언제 만날까요?</h2>
          <p className="m-0 text-sm leading-6 text-[#7185a3]">각자 가능한 날짜를 선택하면<br />모두의 응답이 실시간으로 반영돼요.</p>
        </div>
        {voteNotification ? (
          <div className="animate-vote-notice flex min-w-[230px] items-center gap-2 rounded-[10px] bg-[#effbf5] px-3.5 py-2.5 text-[13px] font-bold text-[#168a57] max-[800px]:w-full max-[800px]:min-w-0" key={voteNotification.id} role="status" aria-live="polite">
            <i className="size-2 rounded-full bg-[#1fc275]" aria-hidden="true" />
            <span>{voteNotification.nickname}님이 투표했어요.</span>
          </div>
        ) : null}
      </header>

      {refetchError && <div className="mb-3.5 flex items-center justify-between gap-3 rounded-[10px] border border-[#f1d18a] bg-[#fff8e7] px-[13px] py-[11px] text-xs text-[#825b0c]"><p className="m-0 leading-[1.5]">최신 투표를 다시 확인하지 못했어요. 불러온 내용과 편집본은 그대로 유지했습니다.</p><button className="inline-flex items-center gap-[5px] border-0 bg-transparent text-xs font-extrabold text-[#3369a8]" type="button" onClick={onRetry}><RotateCcw size={14} /> 다시 확인</button></div>}
      {state.hasConflict && <div className="mb-3.5 flex items-center justify-between gap-3 rounded-[10px] border border-[#f1d18a] bg-[#fff8e7] px-[13px] py-[11px] text-xs text-[#825b0c]"><p className="m-0 leading-[1.5]">다른 화면에서 내 투표가 변경됐어요. 현재 편집본은 그대로 유지했습니다.</p><button className="inline-flex items-center gap-[5px] border-0 bg-transparent text-xs font-extrabold text-[#3369a8]" type="button" onClick={() => dispatch({ type: 'RELOAD_REMOTE' })}><RotateCcw size={14} /> 서버 내용 다시 불러오기</button></div>}
      {state.removedDateCount > 0 && <p className="mb-3.5 rounded-[9px] bg-[#edf6ff] px-3 py-2.5 text-xs leading-[1.5] text-[#386b9f]">투표 기간이 바뀌어 선택할 수 없게 된 {state.removedDateCount}개 날짜를 편집본에서 제외했어요.</p>}

      <VoteToolSelector disabled={state.isSaving} value={tool} onChange={setTool} />
      <VoteCalendar disabled={state.isSaving} draft={state.draft} enabledDates={enabledDates} participantsCount={participantsCount} selectedDate={selectedDate} tool={tool} dispatch={dispatch} onSelectDate={onSelectDate} />

      {saveError && <p className="mt-3 mb-0 text-[13px] font-bold text-[#df4d4d]">{saveError}</p>}
      <div className="mt-[22px] flex items-center justify-between gap-[15px] max-[520px]:flex-col max-[520px]:items-stretch">
        <button className="inline-flex items-center gap-[5px] border-0 bg-transparent text-[13px] font-extrabold text-[#3369a8] disabled:opacity-50" type="button" disabled={state.isSaving} onClick={() => dispatch({ type: 'CLEAR_ALL' })}><RotateCcw size={14} /> 선택 초기화</button>
        <button className={`${buttonClass} ${primaryButtonClass} min-w-[150px] max-[520px]:w-full`} type="button" aria-busy={state.isSaving} disabled={!canSaveVoteEditor(state)} onClick={() => void saveVotes()}>{state.isSaving ? '투표 중…' : <><Check size={18} /> {state.hasConflict ? '현재 편집본으로 투표하기' : '투표하기'}</>}</button>
      </div>
    </section>
  )
}
