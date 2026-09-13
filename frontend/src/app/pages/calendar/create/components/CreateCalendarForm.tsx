import { ChevronRight } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { FieldError } from '../../components/FieldError'
import type { CalendarForm } from '../model/calendarForm'

interface CreateCalendarFormProps {
  form: UseFormReturn<CalendarForm>
  isPending: boolean
  hasRequestError: boolean
  onSubmit: (values: CalendarForm) => void
}

export function CreateCalendarForm({
  form,
  isPending,
  hasRequestError,
  onSubmit,
}: CreateCalendarFormProps) {
  return (
    <section className="workspace-panel create-calendar-panel">
      <form className="calendar-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="calendar-form-section">
          <div className="calendar-form-section-heading">
            <span>1</span>
            <div><h2>기본 정보</h2><p>참여자에게 보이는 모임 정보를 적어주세요.</p></div>
          </div>
          <label>
            <span>캘린더 제목 <em>*</em></span>
            <input {...form.register('title')} maxLength={100} placeholder="예) 9월 스터디 모임" autoFocus />
            <small>모임의 목적이 드러나는 제목을 입력해주세요.</small>
            <FieldError message={form.formState.errors.title?.message} />
          </label>
          <label>
            <span>설명 <i>(선택)</i></span>
            <textarea
              {...form.register('description')}
              maxLength={500}
              placeholder="예) 함께 가능한 시간을 골라 첫 스터디 일정을 정해요."
              rows={4}
            />
            <small>{form.watch('description')?.length ?? 0}/500</small>
            <FieldError message={form.formState.errors.description?.message} />
          </label>
        </div>

        <div className="calendar-form-section">
          <div className="calendar-form-section-heading">
            <span>2</span>
            <div><h2>참여와 투표 기간</h2><p>참여자가 고를 수 있는 날짜 범위를 설정해주세요.</p></div>
          </div>
          <div className="form-grid-two">
            <label>
              <span>시작일 <em>*</em></span>
              <input type="date" {...form.register('start_date')} />
              <FieldError message={form.formState.errors.start_date?.message} />
            </label>
            <label>
              <span>종료일 <em>*</em></span>
              <input type="date" {...form.register('end_date')} />
              <FieldError message={form.formState.errors.end_date?.message} />
            </label>
          </div>
        </div>

        <div className="calendar-form-section">
          <div className="calendar-form-section-heading">
            <span>3</span>
            <div><h2>방장 정보</h2><p>참여자 목록에 표시될 이름입니다.</p></div>
          </div>
          <label>
            <span>방장 닉네임 <em>*</em></span>
            <input {...form.register('hostNickname')} maxLength={20} placeholder="모임에서 사용할 닉네임" />
            <FieldError message={form.formState.errors.hostNickname?.message} />
          </label>
        </div>

        {hasRequestError && (
          <p className="form-error workspace-request-error" role="alert">
            캘린더를 만들지 못했어요. 입력 내용을 확인한 뒤 다시 시도해주세요.
          </p>
        )}
        <div className="calendar-form-actions">
          <Link className="button button-secondary" to="/calendars">취소</Link>
          <button className="button button-primary" type="submit" disabled={isPending}>
            {isPending ? '만드는 중…' : <>캘린더 만들기 <ChevronRight size={18} /></>}
          </button>
        </div>
      </form>
    </section>
  )
}
