import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import { calendarDetailQuery } from '../../../../domains/calendar'
import { loginParticipant, registerParticipant, setParticipantSession } from '../../../../domains/participant'
import { isApiError } from '../../../../shared/api/httpClient'
import { useCalendarParticipantAccess } from '../../../guards/useCalendarParticipantAccess'
import { useAuth } from '../../../providers/AuthProvider'
import { WorkspaceLayout } from '../../components/WorkspaceLayout'
import { JoinCalendarSummary } from './components/JoinCalendarSummary'
import { JoinFormPanel } from './components/JoinFormPanel'
import { JoinPageIntro } from './components/JoinPageIntro'
import { joinSchema, type JoinForm, type JoinMode } from './model/joinForm'

export function CalendarJoinPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { accessToken, status, user, userUuid } = useAuth()
  const {
    memberIdentityUnavailable,
    participantSession: usableExistingSession,
  } = useCalendarParticipantAccess(slug)
  const [mode, setMode] = useState<JoinMode>(status === 'authenticated' ? 'member-existing' : 'guest-new')
  const form = useForm<JoinForm>({ resolver: zodResolver(joinSchema), defaultValues: { nickname: user?.nickname ?? '', password: '' } })
  const calendarQuery = useQuery({ ...calendarDetailQuery(slug), enabled: Boolean(slug) })

  useEffect(() => {
    if (status === 'authenticated') {
      setMode((current) => current.startsWith('guest') ? 'member-existing' : current)
      form.setValue('nickname', user?.nickname ?? '')
    }
  }, [form, status, user?.nickname])

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
        <JoinPageIntro />
        <JoinFormPanel
          authStatus={status}
          userNickname={user?.nickname}
          mode={mode}
          form={form}
          isPending={joinMutation.isPending}
          newEntryBlocked={newEntryBlocked}
          joinError={joinError}
          onModeChange={changeMode}
          onSubmit={onSubmit}
        />
      </div>
    </WorkspaceLayout>
  )
}
