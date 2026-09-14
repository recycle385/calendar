import { ChevronRight } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { FieldError } from '../../components/FieldError'
import { buttonClass, panelClass, primaryButtonClass, secondaryButtonClass } from '../../../../../shared/ui/styles'
import type { CalendarForm } from '../model/calendarForm'

const sectionClass = 'grid gap-4 border-t border-[#eaf0f7] pt-6 first:border-t-0'
const headingClass = 'flex items-center gap-2.5 [&>span]:grid [&>span]:size-[27px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-brand-500 [&>span]:text-xs [&>span]:font-black [&>span]:text-white [&_h2]:m-0 [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-[#19365e] [&_p]:mt-[3px] [&_p]:mb-0 [&_p]:text-xs [&_p]:text-[#8292ab]'
const labelClass = 'grid gap-2 text-[13px] font-extrabold text-[#2d486e] [&_em]:text-[#f05252] [&_em]:not-italic [&_i]:font-medium [&_i]:not-italic [&_i]:text-[#8596af] [&>small]:text-xs [&>small]:font-medium [&>small]:text-[#8495ae]'
const inputClass = 'w-full rounded-[10px] border border-[#d5e2f1] bg-white px-[13px] py-3 text-[#233c62] outline-0 transition focus:border-[#72adff] focus:ring-3 focus:ring-[#e9f3ff]'

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
    <section className={`${panelClass} px-[30px] pt-1.5 pb-[26px] max-[800px]:p-5`}>
      <form className="grid gap-7" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className={sectionClass}>
          <div className={headingClass}>
            <span>1</span>
            <div><h2>기본 정보</h2><p>참여자에게 보이는 모임 정보를 적어주세요.</p></div>
          </div>
          <label className={labelClass}>
            <span>캘린더 제목 <em>*</em></span>
            <input className={inputClass} {...form.register('title')} maxLength={100} placeholder="예) 9월 스터디 모임" autoFocus />
            <small>모임의 목적이 드러나는 제목을 입력해주세요.</small>
            <FieldError message={form.formState.errors.title?.message} />
          </label>
          <label className={labelClass}>
            <span>설명 <i>(선택)</i></span>
            <textarea className={`${inputClass} resize-y leading-[1.55]`}
              {...form.register('description')}
              maxLength={500}
              placeholder="예) 함께 가능한 시간을 골라 첫 스터디 일정을 정해요."
              rows={4}
            />
            <small>{form.watch('description')?.length ?? 0}/500</small>
            <FieldError message={form.formState.errors.description?.message} />
          </label>
        </div>

        <div className={sectionClass}>
          <div className={headingClass}>
            <span>2</span>
            <div><h2>투표 기간</h2><p>참여자가 투표할 수 있는 기간을 설정해주세요.</p></div>
          </div>
          <div className="grid grid-cols-2 gap-3.5 max-[520px]:grid-cols-1">
            <label className={labelClass}>
              <span>투표 시작일 <em>*</em></span>
              <input className={inputClass} type="date" {...form.register('vote_start_date')} />
              <FieldError message={form.formState.errors.vote_start_date?.message} />
            </label>
            <label className={labelClass}>
              <span>투표 종료일 <em>*</em></span>
              <input className={inputClass} type="date" {...form.register('vote_end_date')} />
              <FieldError message={form.formState.errors.vote_end_date?.message} />
            </label>
          </div>
        </div>

        <div className={sectionClass}>
          <div className={headingClass}>
            <span>3</span>
            <div><h2>투표할 날짜</h2><p>참여자가 선택할 수 있는 후보 날짜 범위를 설정해주세요.</p></div>
          </div>
          <div className="grid grid-cols-2 gap-3.5 max-[520px]:grid-cols-1">
            <label className={labelClass}>
              <span>후보 시작일 <em>*</em></span>
              <input className={inputClass} type="date" {...form.register('start_date')} />
              <FieldError message={form.formState.errors.start_date?.message} />
            </label>
            <label className={labelClass}>
              <span>후보 종료일 <em>*</em></span>
              <input className={inputClass} type="date" {...form.register('end_date')} />
              <FieldError message={form.formState.errors.end_date?.message} />
            </label>
          </div>
        </div>

        <div className={sectionClass}>
          <div className={headingClass}>
            <span>4</span>
            <div><h2>방장 정보</h2><p>참여자 목록에 표시될 이름입니다.</p></div>
          </div>
          <label className={labelClass}>
            <span>방장 닉네임 <em>*</em></span>
            <input className={inputClass} {...form.register('hostNickname')} maxLength={20} placeholder="모임에서 사용할 닉네임" />
            <FieldError message={form.formState.errors.hostNickname?.message} />
          </label>
        </div>

        {hasRequestError && (
          <p className="-mt-2.5 mb-0 text-[13px] font-bold text-[#df4d4d]" role="alert">
            캘린더를 만들지 못했어요. 입력 내용을 확인한 뒤 다시 시도해주세요.
          </p>
        )}
        <div className="flex justify-end gap-2.5 max-[520px]:flex-col max-[520px]:items-stretch [&>*]:max-[520px]:w-full">
          <Link className={`${buttonClass} ${secondaryButtonClass}`} to="/calendars">취소</Link>
          <button className={`${buttonClass} ${primaryButtonClass}`} type="submit" disabled={isPending}>
            {isPending ? '만드는 중…' : <>캘린더 만들기 <ChevronRight size={18} /></>}
          </button>
        </div>
      </form>
    </section>
  )
}
