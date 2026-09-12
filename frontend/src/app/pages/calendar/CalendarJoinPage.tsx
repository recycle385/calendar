import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CalendarDays, CheckCircle2, KeyRound, Link2, LogIn, UserRound, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'

import { calendarDetailQuery } from '../../../domains/calendar'
import { getParticipantSession, isLinkedMemberParticipantSession, isParticipantSessionUsable, loginParticipant, registerParticipant, removeParticipantToken, setParticipantSession } from '../../../domains/participant'
import { isApiError } from '../../../shared/api/httpClient'
import { assetUrl } from '../../../shared/assets/assetUrl'
import { formatDate } from '../../../shared/utils/format'
import { useAuth } from '../../providers/AuthProvider'
import { WorkspaceLayout } from '../components/WorkspaceLayout'
import { PLACEHOLDER_IMAGE_PATH } from './calendarHelpers'

type JoinMode = 'member-existing' | 'member-new' | 'guest-existing' | 'guest-new'

const joinSchema = z.object({
  nickname: z.string().trim().min(1, '닉네임을 입력해주세요.').max(20, '닉네임은 20자 이내로 입력해주세요.'),
  password: z.string().max(100, '비밀번호가 너무 깁니다.').optional(),
})

type JoinForm = z.infer<typeof joinSchema>

export function CalendarJoinPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { accessToken, status, user, userUuid } = useAuth()
  const [mode, setMode] = useState<JoinMode>(status === 'authenticated' ? 'member-existing' : 'guest-new')
  const form = useForm<JoinForm>({ resolver: zodResolver(joinSchema), defaultValues: { nickname: user?.nickname ?? '', password: '' } })
  const calendarQuery = useQuery({ ...calendarDetailQuery(slug), enabled: Boolean(slug) })
  const existingSession = getParticipantSession(slug)
  const memberIdentityUnavailable = isLinkedMemberParticipantSession(existingSession)
    && (status === 'restoring' || status === 'restore-failed')
  const usableExistingSession = !memberIdentityUnavailable
    && isParticipantSessionUsable(existingSession, status === 'authenticated' ? userUuid : null)

  useEffect(() => {
    if (status === 'authenticated') {
      setMode((current) => current.startsWith('guest') ? 'member-existing' : current)
      form.setValue('nickname', user?.nickname ?? '')
    }
  }, [form, status, user?.nickname])

  useEffect(() => {
    if (status === 'restoring' || status === 'restore-failed' || !existingSession || usableExistingSession) return
    removeParticipantToken(slug)
  }, [existingSession, slug, status, usableExistingSession])

  const isExisting = mode.endsWith('existing')
  const isMember = mode.startsWith('member')
  const joinMutation = useMutation({
    mutationFn: async (values: JoinForm) => {
      if (isMember && isExisting) return loginParticipant(slug, {}, accessToken)
      if (isMember) return registerParticipant(slug, { nickname: values.nickname.trim() }, accessToken)

      const payload = { nickname: values.nickname.trim(), password: values.password }
      return isExisting ? loginParticipant(slug, payload) : registerParticipant(slug, payload)
    },
    onSuccess: (result) => {
      setParticipantSession(slug, {
        participantToken: result.participantToken,
        participantUuid: result.participant.uuid,
        linkedUserUuid: isMember ? userUuid : null,
      })
      navigate(`/c/${slug}`, { replace: true })
    },
  })

  const joinError = useMemo(() => {
    if (!joinMutation.error) return null
    if (isApiError(joinMutation.error) && joinMutation.error.status === 401) return '참여 정보를 확인하지 못했어요. 닉네임과 비밀번호를 다시 확인해주세요.'
    if (isApiError(joinMutation.error) && joinMutation.error.status === 409) return '이미 같은 닉네임으로 참여 중일 수 있어요. 재참여를 선택해보세요.'
    return '참여 처리에 실패했어요. 네트워크를 확인한 뒤 다시 시도해주세요.'
  }, [joinMutation.error])

  if (!slug) return <Navigate to="/" replace />
  if (memberIdentityUnavailable) return <WorkspaceLayout><section className="workspace-empty-state">{status === 'restore-failed' ? '네트워크 문제로 회원과 참여 세션을 확인하지 못했어요. 새로고침 후 다시 시도해주세요.' : '회원과 참여 세션을 확인하고 있어요.'}</section></WorkspaceLayout>
  if (usableExistingSession) return <Navigate to={`/c/${slug}`} replace />

  if (calendarQuery.isPending) return <WorkspaceLayout><section className="workspace-empty-state">초대받은 캘린더 정보를 불러오는 중이에요.</section></WorkspaceLayout>
  if (calendarQuery.isError || !calendarQuery.data) return <WorkspaceLayout><section className="workspace-empty-state"><h1>캘린더를 찾지 못했어요.</h1><p>받은 링크를 다시 확인해주세요.</p><Link className="button button-secondary" to="/">홈으로 돌아가기</Link></section></WorkspaceLayout>

  const calendar = calendarQuery.data.calendar
  const newEntryBlocked = calendar.is_closed && !isExisting

  function onSubmit(values: JoinForm) {
    if (!isMember && (!values.password || values.password.length < 4)) {
      form.setError('password', { message: '비밀번호는 4자 이상 입력해주세요.' })
      return
    }
    joinMutation.reset()
    joinMutation.mutate(values)
  }

  function changeMode(nextMode: JoinMode) {
    joinMutation.reset()
    setMode(nextMode)
  }

  return (
    <WorkspaceLayout hideRail sideContent={<JoinCalendarSummary slug={slug} title={calendar.title} description={calendar.description} startDate={calendar.start_date} endDate={calendar.end_date} isClosed={calendar.is_closed} />}>
      <div className="join-content-layout">
      <section className="join-page-intro">
        <p className="eyebrow">JOIN CALENDAR</p>
        <h1>함께 만드는<br /><span>더 좋은 시간</span></h1>
        <p>공유받은 링크로 캘린더에 참여하고, 소중한 사람들과 가능한 날짜를 조율해보세요.</p>
        <ul><li><Users size={19} /> 로그인 없이도 빠르게 참여할 수 있어요.</li><li><CheckCircle2 size={19} /> 참여 후 바로 날짜 투표를 시작해요.</li><li><Link2 size={19} /> 링크 하나로 언제든 다시 들어올 수 있어요.</li></ul>
      </section>

      <section className="workspace-panel join-form-panel">
        <div className="join-form-heading"><h1>캘린더 참여하기</h1><p>내 상황에 맞는 방법을 선택해주세요.</p></div>
        {status === 'authenticated' ? (
          <div className="join-member-choice">
            <button type="button" className={isMember ? 'is-selected' : ''} onClick={() => changeMode('member-existing')}><LogIn size={21} /><span><strong>{user?.nickname ?? '현재'} 계정으로 참여</strong><small>로그인한 계정에 캘린더를 저장해요.</small></span></button>
            <button type="button" className={!isMember ? 'is-selected' : ''} onClick={() => changeMode('guest-new')}><UserRound size={21} /><span><strong>게스트로 참여</strong><small>계정과 분리해서 새로 참여해요.</small></span></button>
          </div>
        ) : (
          <div className="join-member-choice join-guest-notice"><UserRound size={20} /><span><strong>게스트 참여</strong><small>계정 없이도 바로 일정에 참여할 수 있어요.</small></span></div>
        )}

        {isMember && isExisting ? (
          <div className="member-login-confirm"><UserRound size={24} /><div><strong>{user?.nickname ?? '현재'} 계정으로 참여할까요?</strong><p>참여한 캘린더는 내 계정에서 다시 확인할 수 있어요.</p></div></div>
        ) : (
          <form className="calendar-form join-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <label><span>닉네임 <em>*</em></span><input {...form.register('nickname')} placeholder="캘린더에서 사용할 이름" maxLength={20} /><FieldError message={form.formState.errors.nickname?.message} /></label>
            {!isMember && <label><span>참여 비밀번호 <em>*</em></span><input {...form.register('password')} type="password" placeholder={isExisting ? '참여할 때 사용한 비밀번호' : '다시 참여할 때 사용할 비밀번호'} autoComplete="new-password" /><small>비밀번호는 저장하지 않아요. 재참여 시 직접 입력해야 해요.</small><FieldError message={form.formState.errors.password?.message} /></label>}
          </form>
        )}

        {newEntryBlocked && <p className="join-closed-notice" role="status">이 캘린더는 마감되어 새로 참여할 수 없어요. 이전에 참여했다면 재참여를 선택해주세요.</p>}
        {joinError && <p className="form-error workspace-request-error" role="alert">{joinError}</p>}
        <div className="join-form-actions">
          {isExisting ? (
            <button type="button" className="button button-secondary" onClick={() => changeMode(isMember ? 'member-new' : 'guest-new')}>새로 참여하기</button>
          ) : (
            <button type="button" className="button button-secondary" onClick={() => changeMode(isMember ? 'member-existing' : 'guest-existing')}>다시 참여하기</button>
          )}
          <button className="button button-primary" type="button" disabled={joinMutation.isPending || newEntryBlocked} onClick={() => {
            if (isMember && isExisting) joinMutation.mutate({ nickname: '', password: '' })
            else void form.handleSubmit(onSubmit)()
          }}>
            {joinMutation.isPending ? '참여 중…' : isExisting ? '캘린더 다시 참여하기' : '캘린더 참여하기'} <LogIn size={18} />
          </button>
        </div>
      </section>
      </div>
    </WorkspaceLayout>
  )
}

function FieldError({ message }: { message?: string }) { return message ? <small className="form-error" role="alert">{message}</small> : null }

interface JoinCalendarSummaryProps { slug: string; title: string; description: string | null; startDate: string; endDate: string; isClosed: boolean }

function JoinCalendarSummary({ slug, title, description, startDate, endDate, isClosed }: JoinCalendarSummaryProps) {
  return <>
    <section className="workspace-aside-card join-summary-card">
      <img src={assetUrl(PLACEHOLDER_IMAGE_PATH)} alt={`${title} 대표 이미지`} />
      <span className={isClosed ? 'workspace-status is-closed' : 'workspace-status'}>{isClosed ? '마감됨' : '참여 가능'}</span>
      <h2>{title}</h2><p>{description || '함께 가능한 시간을 찾아보세요.'}</p>
      <dl><div><dt><CalendarDays size={16} /> 기간</dt><dd>{formatDate(startDate)} — {formatDate(endDate)}</dd></div><div><dt><KeyRound size={16} /> 참여 코드</dt><dd>{slug}</dd></div></dl>
    </section>
    <section className="workspace-aside-card join-info-card"><h2>참여 전에 확인해주세요</h2><ol><li>참여한 뒤 바로 날짜 투표를 할 수 있어요.</li><li>게스트는 비밀번호를 기억해두세요.</li><li>마감된 캘린더는 새 참여가 제한돼요.</li></ol></section>
  </>
}
