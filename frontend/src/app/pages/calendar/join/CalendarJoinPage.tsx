import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import { calendarDetailQuery, myCalendarsQuery } from '../../../../domains/calendar'
import { setParticipantSession } from '../../../../domains/participant'
import { isApiError } from '../../../../shared/api/httpClient'
import { buttonClass, secondaryButtonClass } from '../../../../shared/ui/styles'
import { useCalendarParticipantAccess } from '../../../guards/useCalendarParticipantAccess'
import { useAuth } from '../../../providers/AuthProvider'
import { WorkspaceLayout } from '../../components/WorkspaceLayout'
import { JoinCalendarSummary } from './components/JoinCalendarSummary'
import { JoinFormPanel } from './components/JoinFormPanel'
import { JoinPageIntro } from './components/JoinPageIntro'
import { joinGuestParticipant } from './model/joinGuestParticipant'
import { joinMemberParticipant } from './model/joinMemberParticipant'
import { joinSchema, type JoinForm, type JoinMode } from './model/joinForm'

export function CalendarJoinPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { accessToken, status, user, userUuid } = useAuth()
  const {
    memberIdentityUnavailable,
    participantSession: usableExistingSession,
  } = useCalendarParticipantAccess(slug)
  const [mode, setMode] = useState<JoinMode>(status === 'authenticated' ? 'member' : 'guest')
  const ownerEntryStarted = useRef(false)
  const form = useForm<JoinForm>({ resolver: zodResolver(joinSchema), defaultValues: { nickname: user?.nickname ?? '', password: '' } })
  const calendarQuery = useQuery({ ...calendarDetailQuery(slug), enabled: Boolean(slug) })
  const ownedCalendarsQuery = useQuery({
    ...myCalendarsQuery(userUuid ?? '', accessToken ?? ''),
    enabled: Boolean(slug && status === 'authenticated' && userUuid && accessToken),
  })

  useEffect(() => {
    if (status === 'authenticated') {
      setMode('member')
      form.setValue('nickname', user?.nickname ?? '')
    }
  }, [form, status, user?.nickname])

  useEffect(() => {
    ownerEntryStarted.current = false
  }, [slug, userUuid])

  const isMember = mode === 'member'
  const joinMutation = useMutation({
    mutationFn: async (values: JoinForm) => {
      if (isMember) {
        return joinMemberParticipant(slug, values.nickname || user?.nickname || '', accessToken)
      }

      return joinGuestParticipant(slug, values.nickname.trim(), values.password ?? '')
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
    if (isApiError(joinMutation.error) && joinMutation.error.status === 409) return '이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해주세요.'
    return '참여 처리에 실패했어요. 네트워크를 확인한 뒤 다시 시도해주세요.'
  }, [joinMutation.error])

  const isOwner = ownedCalendarsQuery.data?.calendars.some((calendar) => calendar.slug === slug) ?? false

  useEffect(() => {
    if (!isOwner || usableExistingSession || ownerEntryStarted.current) return

    ownerEntryStarted.current = true
    joinMutation.mutate({ nickname: user?.nickname ?? '', password: '' })
  }, [isOwner, joinMutation, usableExistingSession, user?.nickname])

  if (!slug) return <Navigate to="/" replace />
  if (memberIdentityUnavailable) return <WorkspaceLayout><section className="grid min-h-[250px] place-content-center text-center text-[#69809f]">{status === 'restore-failed' ? '네트워크 문제로 회원과 참여 세션을 확인하지 못했어요. 새로고침 후 다시 시도해주세요.' : '회원과 참여 세션을 확인하고 있어요.'}</section></WorkspaceLayout>
  if (usableExistingSession) return <Navigate to={`/c/${slug}`} replace />

  if (calendarQuery.isPending) return <WorkspaceLayout><section className="grid min-h-[250px] place-content-center text-center text-[#69809f]">초대받은 캘린더 정보를 불러오는 중이에요.</section></WorkspaceLayout>
  if (calendarQuery.isError || !calendarQuery.data) return <WorkspaceLayout><section className="grid min-h-[250px] place-content-center justify-items-center gap-3 text-center text-[#69809f]"><h1 className="m-0 text-[22px] font-black text-[#19345d]">캘린더를 찾지 못했어요.</h1><p>받은 링크를 다시 확인해주세요.</p><Link className={`${buttonClass} ${secondaryButtonClass}`} to="/">홈으로 돌아가기</Link></section></WorkspaceLayout>
  if (status === 'authenticated' && ownedCalendarsQuery.isPending) return <WorkspaceLayout><section className="grid min-h-[250px] place-content-center text-center text-[#69809f]">내 캘린더인지 확인하고 있어요.</section></WorkspaceLayout>
  if (status === 'authenticated' && ownedCalendarsQuery.isError) return <WorkspaceLayout><section className="grid min-h-[250px] place-content-center justify-items-center gap-3 text-center text-[#69809f]"><p>내 캘린더 정보를 확인하지 못했어요.</p><button className={`${buttonClass} ${secondaryButtonClass}`} type="button" onClick={() => void ownedCalendarsQuery.refetch()}>다시 시도</button></section></WorkspaceLayout>
  if (isOwner) return <WorkspaceLayout><section className="grid min-h-[250px] place-content-center justify-items-center gap-3 text-center text-[#69809f]"><p>{joinMutation.isError ? joinError : '내 캘린더로 이동하고 있어요.'}</p>{joinMutation.isError && <button className={`${buttonClass} ${secondaryButtonClass}`} type="button" onClick={() => joinMutation.mutate({ nickname: user?.nickname ?? '', password: '' })}>다시 시도</button>}</section></WorkspaceLayout>

  const calendar = calendarQuery.data.calendar

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
      <div className="grid grid-cols-[minmax(220px,0.68fr)_minmax(400px,1fr)] items-start gap-6 max-[980px]:grid-cols-1 max-[980px]:gap-0">
        <JoinPageIntro />
        <JoinFormPanel
          authStatus={status}
          userNickname={user?.nickname}
          mode={mode}
          form={form}
          isPending={joinMutation.isPending}
          isClosed={calendar.is_closed}
          joinError={joinError}
          onModeChange={changeMode}
          onSubmit={onSubmit}
        />
      </div>
    </WorkspaceLayout>
  )
}
