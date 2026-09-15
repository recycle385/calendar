import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { FieldError } from '../../components/FieldError'
import { buttonClass, panelClass, primaryButtonClass, secondaryButtonClass } from '../../../../../shared/ui/styles'
import {
  calendarSettingsSchema,
  type CalendarSettingsForm,
} from '../model/calendarSettingsForm'

const labelClass = 'grid gap-2 text-sm font-extrabold text-[#2d486e] [&>small]:text-xs [&>small]:font-medium [&>small]:text-[#8495ae]'
const inputClass = 'w-full rounded-[10px] border border-[#d5e2f1] bg-white px-[13px] py-3 text-[#233c62] outline-0 transition focus:border-[#72adff] focus:ring-3 focus:ring-[#e9f3ff] disabled:cursor-not-allowed disabled:bg-[#f5f7fa] disabled:text-[#8b9ab0]'
const dateSectionClass = 'grid gap-3 rounded-xl border border-[#e1eaf5] bg-[#f9fbfe] p-4'

interface SettingsPanelProps {
  calendar: Calendar
  accessToken: string
  participantUuid: string
}

export function SettingsPanel({ calendar, accessToken, participantUuid }: SettingsPanelProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const form = useForm<CalendarSettingsForm>({
    resolver: zodResolver(calendarSettingsSchema),
    defaultValues: {
      title: calendar.title,
      description: calendar.description ?? '',
      vote_start_date: calendar.vote_start_date,
      vote_end_date: calendar.vote_end_date,
      start_date: calendar.start_date,
      end_date: calendar.end_date,
    },
  })

  useEffect(() => {
    form.reset({
      title: calendar.title,
      description: calendar.description ?? '',
      vote_start_date: calendar.vote_start_date,
      vote_end_date: calendar.vote_end_date,
      start_date: calendar.start_date,
      end_date: calendar.end_date,
    })
  }, [
    calendar.description,
    calendar.end_date,
    calendar.start_date,
    calendar.title,
    calendar.vote_end_date,
    calendar.vote_start_date,
    form,
  ])

  const updateMutation = useMutation({
    mutationFn: (values: CalendarSettingsForm) => updateCalendar(
      calendar.slug,
      {
        title: values.title.trim(),
        description: values.description.trim() || null,
        vote_start_date: values.vote_start_date,
        vote_end_date: values.vote_end_date,
        start_date: values.start_date,
        end_date: values.end_date,
      },
      accessToken,
    ),
    onSuccess: (_, values) => {
      form.reset(values)
      void refreshCalendarData(queryClient, calendar.slug, participantUuid)
    },
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

  function submitSettings(values: CalendarSettingsForm) {
    const candidatePeriodShrank = values.start_date > calendar.start_date || values.end_date < calendar.end_date
    if (candidatePeriodShrank && !window.confirm('후보 날짜 범위를 줄이면 범위에서 제외된 날짜의 기존 투표가 삭제될 수 있어요. 계속할까요?')) {
      return
    }

    updateMutation.mutate(values)
  }

  return (
    <section className={`${panelClass} grid gap-[17px] p-[25px] max-[800px]:p-5`}>
      <div className="mb-1 flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-[21px] font-black tracking-[-0.04em] text-[#19365e]">캘린더 설정</h2>
          <p className="mt-1.5 mb-0 text-xs text-[#7b8da8]">방장만 캘린더 정보를 변경하거나 마감할 수 있어요.</p>
        </div>
      </div>
      <form className="grid gap-[17px]" onSubmit={form.handleSubmit(submitSettings)} noValidate>
        <label className={labelClass}>
          <span>캘린더 제목</span>
          <input className={inputClass} {...form.register('title')} maxLength={100} disabled={calendar.is_closed} />
          <FieldError message={form.formState.errors.title?.message} />
        </label>
        <label className={labelClass}>
          <span>설명</span>
          <textarea className={`${inputClass} resize-y leading-[1.55]`} {...form.register('description')} maxLength={500} rows={4} disabled={calendar.is_closed} />
          <small>{form.watch('description').length}/500</small>
          <FieldError message={form.formState.errors.description?.message} />
        </label>

        <div className={dateSectionClass}>
          <div><h3 className="m-0 text-base font-black text-[#27466e]">투표 기간</h3><p className="mt-1 mb-0 text-[13px] text-[#7b8da8]">참여자가 투표할 수 있는 기간이에요.</p></div>
          <div className="grid grid-cols-2 gap-3.5 max-[520px]:grid-cols-1">
            <label className={labelClass}>
              <span>투표 시작일</span>
              <input className={inputClass} type="date" {...form.register('vote_start_date')} disabled={calendar.is_closed} />
              <FieldError message={form.formState.errors.vote_start_date?.message} />
            </label>
            <label className={labelClass}>
              <span>투표 종료일</span>
              <input className={inputClass} type="date" min={form.watch('vote_start_date')} {...form.register('vote_end_date')} disabled={calendar.is_closed} />
              <FieldError message={form.formState.errors.vote_end_date?.message} />
            </label>
          </div>
        </div>

        <div className={dateSectionClass}>
          <div><h3 className="m-0 text-base font-black text-[#27466e]">투표할 후보 날짜</h3><p className="mt-1 mb-0 text-[13px] text-[#7b8da8]">참여자가 선택할 수 있는 날짜 범위예요.</p></div>
          <div className="grid grid-cols-2 gap-3.5 max-[520px]:grid-cols-1">
            <label className={labelClass}>
              <span>후보 시작일</span>
              <input className={inputClass} type="date" {...form.register('start_date')} disabled={calendar.is_closed} />
              <FieldError message={form.formState.errors.start_date?.message} />
            </label>
            <label className={labelClass}>
              <span>후보 종료일</span>
              <input className={inputClass} type="date" min={form.watch('start_date')} {...form.register('end_date')} disabled={calendar.is_closed} />
              <FieldError message={form.formState.errors.end_date?.message} />
            </label>
          </div>
          <p className="m-0 text-xs font-medium leading-5 text-[#8a6b3d]">범위에서 제외된 후보 날짜의 기존 투표는 함께 삭제될 수 있어요.</p>
        </div>

        {updateMutation.isError && <p className="m-0 text-[13px] font-bold text-[#df4d4d]" role="alert">저장하지 못했어요. 입력 내용을 확인한 뒤 다시 시도해주세요.</p>}
        {updateMutation.isSuccess && !form.formState.isDirty && <p className="m-0 text-[13px] font-bold text-[#23875d]" role="status">변경 사항을 저장했어요.</p>}
        <button
          className={`${buttonClass} ${primaryButtonClass}`}
          type="submit"
          disabled={calendar.is_closed || !form.formState.isDirty || updateMutation.isPending}
        >
          {calendar.is_closed ? '마감된 캘린더' : updateMutation.isPending ? '저장 중…' : '변경 사항 저장'}
        </button>
      </form>
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
