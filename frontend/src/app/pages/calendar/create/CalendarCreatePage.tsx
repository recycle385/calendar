import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { calendarKeys, createCalendar } from '../../../../domains/calendar'
import { setParticipantSession } from '../../../../domains/participant'
import { useAuth } from '../../../providers/AuthProvider'
import { LoginRequired, WorkspaceLayout } from '../../components/WorkspaceLayout'
import { CreateAside } from './components/CreateAside'
import { CreateCalendarForm } from './components/CreateCalendarForm'
import { calendarSchema, type CalendarForm } from './model/calendarForm'

export function CalendarCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { accessToken, status, user, userUuid } = useAuth()
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
        linkedUserUuid: userUuid,
      })
      void queryClient.invalidateQueries({ queryKey: calendarKeys.myRoot() })
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
      <CreateCalendarForm
        form={form}
        isPending={createMutation.isPending}
        hasRequestError={createMutation.isError}
        onSubmit={onSubmit}
      />
    </WorkspaceLayout>
  )
}
