import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Check, ChevronRight, Link2, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { createCalendar } from '../../../domains/calendar'
import { setParticipantSession } from '../../../domains/participant'
import { assetUrl } from '../../../shared/assets/assetUrl'
import { useAuth } from '../../providers/AuthProvider'
import { LoginRequired, WorkspaceLayout } from '../components/WorkspaceLayout'
import { isValidCalendarRange, PLACEHOLDER_IMAGE_PATH } from './calendarHelpers'

const calendarSchema = z
  .object({
    title: z.string().trim().min(1, '캘린더 제목을 입력해주세요.').max(100, '제목은 100자 이내로 입력해주세요.'),
    description: z.string().trim().max(500, '설명은 500자 이내로 입력해주세요.').optional(),
    hostNickname: z.string().trim().min(1, '방장 닉네임을 입력해주세요.').max(20, '닉네임은 20자 이내로 입력해주세요.'),
    start_date: z.string().min(1, '시작일을 선택해주세요.'),
    end_date: z.string().min(1, '종료일을 선택해주세요.'),
  })
  .refine(({ start_date, end_date }) => isValidCalendarRange(start_date, end_date), {
    message: '시작일부터 종료일까지 최대 366일 안에서 올바른 날짜를 선택해주세요.',
    path: ['end_date'],
  })

type CalendarForm = z.infer<typeof calendarSchema>

export function CalendarCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { accessToken, status, user } = useAuth()
  const form = useForm<CalendarForm>({
    resolver: zodResolver(calendarSchema),
    defaultValues: {
      title: '',
      description: '',
      hostNickname: user?.nickname ?? '',
      start_date: '',
      end_date: '',
    },
  })
  const createMutation = useMutation({
    mutationFn: (values: CalendarForm) => createCalendar({
      ...values,
      description: values.description || undefined,
    }, accessToken!),
    onSuccess: (result) => {
      setParticipantSession(result.calendar.slug, {
        participantToken: result.participantToken,
        participantUuid: result.calendar.hostParticipantUuid,
        linkedUserUuid: user?.user_uuid,
      })
      void queryClient.invalidateQueries({ queryKey: ['calendar', 'my'] })
      navigate(`/c/${result.calendar.slug}`, { state: { shareUrl: result.shareUrl }, replace: true })
    },
  })

  if (status === 'restoring') return <WorkspaceLayout><section className="workspace-empty-state">로그인 상태를 확인하고 있어요.</section></WorkspaceLayout>
  if (status !== 'authenticated' || !accessToken) return <WorkspaceLayout><LoginRequired /></WorkspaceLayout>

  const onSubmit = (values: CalendarForm) => createMutation.mutate(values)

  return (
    <WorkspaceLayout
      title="캘린더 만들기"
      description="모임의 기본 정보를 입력하고 참여 링크를 만들어보세요."
      sideContent={<CreateAside />}
    >
      <section className="workspace-panel create-calendar-panel">
        <form className="calendar-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="calendar-form-section">
            <div className="calendar-form-section-heading"><span>1</span><div><h2>기본 정보</h2><p>참여자에게 보이는 모임 정보를 적어주세요.</p></div></div>
            <label>
              <span>캘린더 제목 <em>*</em></span>
              <input {...form.register('title')} maxLength={100} placeholder="예) 9월 스터디 모임" autoFocus />
              <small>모임의 목적이 드러나는 제목을 입력해주세요.</small>
              <FieldError message={form.formState.errors.title?.message} />
            </label>
            <label>
              <span>설명 <i>(선택)</i></span>
              <textarea {...form.register('description')} maxLength={500} placeholder="예) 함께 가능한 시간을 골라 첫 스터디 일정을 정해요." rows={4} />
              <small>{form.watch('description')?.length ?? 0}/500</small>
              <FieldError message={form.formState.errors.description?.message} />
            </label>
          </div>

          <div className="calendar-form-section">
            <div className="calendar-form-section-heading"><span>2</span><div><h2>참여와 투표 기간</h2><p>참여자가 고를 수 있는 날짜 범위를 설정해주세요.</p></div></div>
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
            <div className="calendar-form-section-heading"><span>3</span><div><h2>방장 정보</h2><p>참여자 목록에 표시될 이름입니다.</p></div></div>
            <label>
              <span>방장 닉네임 <em>*</em></span>
              <input {...form.register('hostNickname')} maxLength={20} placeholder="모임에서 사용할 닉네임" />
              <FieldError message={form.formState.errors.hostNickname?.message} />
            </label>
          </div>

          {createMutation.isError && <p className="form-error workspace-request-error" role="alert">캘린더를 만들지 못했어요. 입력 내용을 확인한 뒤 다시 시도해주세요.</p>}
          <div className="calendar-form-actions">
            <Link className="button button-secondary" to="/calendars">취소</Link>
            <button className="button button-primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? '만드는 중…' : <>캘린더 만들기 <ChevronRight size={18} /></>}
            </button>
          </div>
        </form>
      </section>
    </WorkspaceLayout>
  )
}

function FieldError({ message }: { message?: string }) {
  return message ? <small className="form-error" role="alert">{message}</small> : null
}

function CreateAside() {
  return (
    <>
      <section className="workspace-aside-card create-preview-card">
        <img src={assetUrl(PLACEHOLDER_IMAGE_PATH)} alt="캘린더 대표 이미지 미리보기" />
        <p className="eyebrow">CALENDAR PREVIEW</p>
        <strong>모임이 만들어지면<br />바로 링크를 공유할 수 있어요.</strong>
      </section>
      <section className="workspace-aside-card workflow-card">
        <h2>생성 후 이렇게 진행돼요</h2>
        <ol>
          <li><span><Link2 size={16} /></span><div><strong>링크 생성</strong><p>고유한 참여 링크가 발급돼요.</p></div></li>
          <li><span><Users size={16} /></span><div><strong>참여자 초대</strong><p>친구와 동료에게 링크를 공유해요.</p></div></li>
          <li><span><CalendarDays size={16} /></span><div><strong>날짜 투표</strong><p>모두 가능한 날을 한눈에 찾아요.</p></div></li>
        </ol>
        <p className="workflow-safety"><Check size={15} /> 생성한 뒤에도 내용을 수정할 수 있어요.</p>
      </section>
    </>
  )
}
