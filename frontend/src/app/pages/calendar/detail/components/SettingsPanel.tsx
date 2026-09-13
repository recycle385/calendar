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
    <section className="workspace-panel settings-panel">
      <div className="detail-panel-heading">
        <div>
          <h2>캘린더 설정</h2>
          <p>방장만 캘린더 정보를 변경하거나 마감할 수 있어요.</p>
        </div>
      </div>
      <label>
        <span>캘린더 제목</span>
        <input value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        <span>설명</span>
        <textarea value={description} maxLength={500} rows={4} onChange={(event) => setDescription(event.target.value)} />
      </label>
      {updateMutation.isError && <p className="form-error">저장하지 못했어요. 다시 시도해주세요.</p>}
      <button
        className="button button-primary"
        type="button"
        disabled={!title.trim() || updateMutation.isPending}
        onClick={() => updateMutation.mutate()}
      >
        {updateMutation.isPending ? '저장 중…' : '변경 사항 저장'}
      </button>
      <hr />
      <div className="settings-danger-zone">
        <div>
          <h3>투표 마감</h3>
          <p>마감하면 참여자는 더 이상 투표를 바꿀 수 없어요.</p>
        </div>
        <button
          className="button button-secondary"
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
      <div className="settings-danger-zone">
        <div>
          <h3>캘린더 삭제</h3>
          <p>캘린더와 참여 기록을 삭제합니다.</p>
        </div>
        <button
          className="button danger-button"
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
