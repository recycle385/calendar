import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  closeCalendar,
  deleteCalendar,
  updateCalendar,
  type Calendar,
} from '../../../../../domains/calendar'
import { removeParticipantToken } from '../../../../../domains/participant'
import {
  clearDeletedCalendarData,
  refreshCalendarData,
} from '../../../../cache/calendarCache'
import { buttonClass, panelClass, primaryButtonClass, secondaryButtonClass } from '../../../../../shared/ui/styles'

const labelClass = 'grid gap-2 text-[13px] font-extrabold text-[#2d486e]'
const inputClass = 'w-full rounded-[10px] border border-[#d5e2f1] bg-white px-[13px] py-3 text-[#233c62] outline-0 focus:border-[#72adff] focus:ring-3 focus:ring-[#e9f3ff]'

interface SettingsPanelProps {
  calendar: Calendar
  accessToken: string
  participantUuid: string
}

export function SettingsPanel({ calendar, accessToken, participantUuid }: SettingsPanelProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(calendar.title)
  const [description, setDescription] = useState(calendar.description ?? '')

  useEffect(() => {
    setTitle(calendar.title)
    setDescription(calendar.description ?? '')
  }, [calendar.description, calendar.title])

  const updateMutation = useMutation({
    mutationFn: () => updateCalendar(
      calendar.slug,
      { title: title.trim(), description: description.trim() || null },
      accessToken,
    ),
    onSuccess: () => void refreshCalendarData(queryClient, calendar.slug, participantUuid),
  })
  const closeMutation = useMutation({
    mutationFn: () => closeCalendar(calendar.slug, accessToken),
    onSuccess: () => void refreshCalendarData(queryClient, calendar.slug, participantUuid),
  })
  const deleteMutation = useMutation({
    mutationFn: () => deleteCalendar(calendar.slug, accessToken),
    onSuccess: () => {
      removeParticipantToken(calendar.slug)
      void clearDeletedCalendarData(queryClient, calendar.slug)
      navigate('/calendars', { replace: true })
    },
  })

  return (
    <section className={`${panelClass} grid gap-[17px] p-[25px] max-[800px]:p-5`}>
      <div className="mb-1 flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-[21px] font-black tracking-[-0.04em] text-[#19365e]">캘린더 설정</h2>
          <p className="mt-1.5 mb-0 text-xs text-[#7b8da8]">방장만 캘린더 정보를 변경하거나 마감할 수 있어요.</p>
        </div>
      </div>
      <label className={labelClass}>
        <span>캘린더 제목</span>
        <input className={inputClass} value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className={labelClass}>
        <span>설명</span>
        <textarea className={`${inputClass} resize-y leading-[1.55]`} value={description} maxLength={500} rows={4} onChange={(event) => setDescription(event.target.value)} />
      </label>
      {updateMutation.isError && <p className="m-0 text-[13px] font-bold text-[#df4d4d]">저장하지 못했어요. 다시 시도해주세요.</p>}
      <button
        className={`${buttonClass} ${primaryButtonClass}`}
        type="button"
        disabled={!title.trim() || updateMutation.isPending}
        onClick={() => updateMutation.mutate()}
      >
        {updateMutation.isPending ? '저장 중…' : '변경 사항 저장'}
      </button>
      <hr className="my-2 w-full border-0 border-t border-[#e6edf5]" />
      <div className="flex items-center justify-between gap-[15px] max-[520px]:flex-col max-[520px]:items-stretch">
        <div>
          <h3 className="m-0 text-sm font-black text-[#314c70]">투표 마감</h3>
          <p className="mt-1 mb-0 text-xs text-[#7f91aa]">마감하면 참여자는 더 이상 투표를 바꿀 수 없어요.</p>
        </div>
        <button
          className={`${buttonClass} ${secondaryButtonClass}`}
          type="button"
          disabled={calendar.is_closed || closeMutation.isPending}
          onClick={() => {
            if (window.confirm('투표를 마감할까요? 이 작업은 되돌릴 수 없어요.')) {
              closeMutation.mutate()
            }
          }}
        >
          {calendar.is_closed ? '마감됨' : '투표 마감하기'}
        </button>
      </div>
      <div className="flex items-center justify-between gap-[15px] max-[520px]:flex-col max-[520px]:items-stretch">
        <div>
          <h3 className="m-0 text-sm font-black text-[#314c70]">캘린더 삭제</h3>
          <p className="mt-1 mb-0 text-xs text-[#7f91aa]">캘린더와 참여 기록을 삭제합니다.</p>
        </div>
        <button
          className={`${buttonClass} bg-[#e96565] text-white`}
          type="button"
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (window.confirm('이 캘린더를 삭제할까요? 되돌릴 수 없어요.')) {
              deleteMutation.mutate()
            }
          }}
        >
          <Trash2 size={16} /> 삭제
        </button>
      </div>
    </section>
  )
}
