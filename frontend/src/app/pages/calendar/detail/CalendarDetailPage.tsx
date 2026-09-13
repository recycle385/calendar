import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom'

import { calendarDetailQuery } from '../../../../domains/calendar'
import { participantsQuery } from '../../../../domains/participant'
import {
  participantVotesQuery,
  useVoteDateSelection,
  useVoteEditor,
  VoteDetailAside,
  VotePanel,
  VoteStatusPanel,
  voteStatusQuery,
} from '../../../../domains/vote'
import { useCalendarParticipantAccess } from '../../../guards/useCalendarParticipantAccess'
import { useParticipantVoteAction } from '../../../hooks/useParticipantVoteAction'
import { WorkspaceLayout } from '../../components/WorkspaceLayout'
import { CalendarHero } from './components/CalendarHero'
import { DetailAside } from './components/DetailAside'
import { DetailTabRail, type DetailTab } from './components/DetailTabRail'
import { ParticipantsPanel } from './components/ParticipantsPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { useCalendarRealtime } from './hooks/useCalendarRealtime'
import { useUnsavedVoteNavigationWarning } from './hooks/useUnsavedVoteNavigationWarning'

const DETAIL_TABS: DetailTab[] = ['vote', 'status', 'participants', 'settings']
interface DetailLocationState { shareUrl?: string }

export function CalendarDetailPage() {
  const { slug = '' } = useParams()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    accessToken,
    authStatus,
    currentUserUuid,
    memberIdentityUnavailable,
    participantSession,
  } = useCalendarParticipantAccess(slug)
  const requestedTab = searchParams.get('tab')
  const requestedDetailTab: DetailTab = requestedTab && DETAIL_TABS.includes(requestedTab as DetailTab)
    ? requestedTab as DetailTab
    : 'vote'

  const calendarQuery = useQuery({ ...calendarDetailQuery(slug), enabled: Boolean(slug && participantSession) })
  const participants = useQuery({ ...participantsQuery(slug), enabled: Boolean(slug && participantSession) })
  const voteStatus = useQuery({ ...voteStatusQuery(slug), enabled: Boolean(slug && participantSession) })
  const ownVotes = useQuery({
    ...participantVotesQuery(slug, participantSession?.participantUuid ?? ''),
    enabled: Boolean(slug && participantSession?.participantUuid),
  })
  const realtime = useCalendarRealtime(slug, participantSession?.participantToken, participantSession?.participantUuid)
  const submitParticipantVotes = useParticipantVoteAction({
    slug,
    session: participantSession,
    currentUserUuid,
    mainAccessToken: accessToken,
  })
  const editorSessionKey = `${slug}:${participantSession?.participantUuid ?? ''}`
  const voteEditor = useVoteEditor({
    sourceKey: editorSessionKey,
    voteStatus: voteStatus.data?.voteStatus,
    ownVotes: ownVotes.data?.votes,
  })
  const voteDateSelection = useVoteDateSelection(voteEditor.enabledDates)

  useUnsavedVoteNavigationWarning(voteEditor.state.isDirty)

  if (!slug) return <Navigate to="/" replace />
  if (memberIdentityUnavailable) {
    const message = authStatus === 'restore-failed'
      ? '네트워크 문제로 회원과 참여 세션을 확인하지 못했어요. 새로고침 후 다시 시도해주세요.'
      : '회원과 참여 세션을 확인하고 있어요.'
    return <WorkspaceLayout><section className="workspace-empty-state">{message}</section></WorkspaceLayout>
  }
  if (!participantSession) return <Navigate to={`/c/${slug}/join`} replace />
  if (realtime.isDeleted) {
    return (
      <WorkspaceLayout>
        <section className="workspace-empty-state">
          <h1>삭제된 캘린더예요.</h1>
          <p>방장이 캘린더를 삭제해서 더 이상 참여할 수 없어요.</p>
          <Link className="button button-primary" to="/">홈으로 돌아가기</Link>
        </section>
      </WorkspaceLayout>
    )
  }

  const calendar = calendarQuery.data?.calendar
  const liveCalendar = calendar && realtime.isClosed ? { ...calendar, is_closed: true } : calendar
  const isHost = Boolean(accessToken && liveCalendar?.hostParticipantUuid === participantSession.participantUuid)
  const tab = requestedDetailTab === 'settings' && !isHost ? 'vote' : requestedDetailTab
  const shareUrl = (location.state as DetailLocationState | null)?.shareUrl ?? `${window.location.origin}/c/${slug}/join`
  const changeTab = (nextTab: DetailTab) => setSearchParams(nextTab === 'vote' ? {} : { tab: nextTab })

  return (
    <WorkspaceLayout
      sideContent={tab === 'vote' ? (
        <VoteDetailAside
          participants={participants.data?.participants ?? []}
          participantsCount={participants.data?.count ?? 0}
          selectedDate={voteDateSelection.selectedDate}
          voteStatus={voteEditor.enabledDates}
          onSelectDate={voteDateSelection.setSelectedDate}
          onViewParticipants={() => changeTab('participants')}
        />
      ) : (
        <DetailAside
          calendar={liveCalendar}
          participants={participants.data?.participants ?? []}
          voteStatus={voteStatus.data?.voteStatus ?? []}
          onlineUsers={realtime.onlineUsers}
          connectionState={realtime.connectionState}
        />
      )}
    >
      <Link className="detail-back-link" to="/calendars">
        <ChevronLeft size={17} /> 내 캘린더로 돌아가기
      </Link>
      {calendarQuery.isPending ? (
        <section className="workspace-panel calendar-feedback">캘린더를 불러오는 중이에요.</section>
      ) : calendarQuery.isError || !liveCalendar ? (
        <section className="workspace-panel calendar-feedback">
          <h1>캘린더 정보를 불러오지 못했어요.</h1>
          <button className="button button-secondary" type="button" onClick={() => void calendarQuery.refetch()}>
            다시 시도
          </button>
        </section>
      ) : (
        <>
          <CalendarHero calendar={liveCalendar} shareUrl={shareUrl} connectionState={realtime.connectionState} />
          <div className="detail-workspace-layout">
            <DetailTabRail activeTab={tab} isHost={isHost} onChange={changeTab} />
            <section className="detail-tab-content">
              {tab === 'vote' && (
                <VotePanel
                  isClosed={liveCalendar.is_closed}
                  enabledDates={voteEditor.enabledDates}
                  enabledDateSet={voteEditor.enabledDateSet}
                  sourceDataReady={voteEditor.sourceDataReady}
                  participantsCount={participants.data?.count ?? 0}
                  voteNotification={realtime.voteNotification}
                  selectedDate={voteDateSelection.selectedDate}
                  loading={(!voteStatus.data && voteStatus.isPending) || (!ownVotes.data && ownVotes.isPending)}
                  loadError={Boolean((voteStatus.isError && !voteStatus.data) || (ownVotes.isError && !ownVotes.data))}
                  refetchError={Boolean((voteStatus.isRefetchError && voteStatus.data) || (ownVotes.isRefetchError && ownVotes.data))}
                  state={voteEditor.state}
                  dispatch={voteEditor.dispatch}
                  onRetry={() => { void Promise.all([voteStatus.refetch(), ownVotes.refetch()]) }}
                  onSelectDate={voteDateSelection.setSelectedDate}
                  onSubmit={submitParticipantVotes}
                />
              )}
              {tab === 'status' && (
                <VoteStatusPanel
                  voteStatus={voteStatus.data?.voteStatus ?? []}
                  participantsCount={participants.data?.count ?? 0}
                  loading={voteStatus.isPending || participants.isPending}
                />
              )}
              {tab === 'participants' && (
                <ParticipantsPanel
                  slug={slug}
                  participants={participants.data?.participants ?? []}
                  session={participantSession}
                  currentUserUuid={currentUserUuid}
                  hostUuid={liveCalendar.hostParticipantUuid}
                  isHost={isHost}
                  accessToken={accessToken}
                  onlineUsers={realtime.onlineUsers}
                  connectionState={realtime.connectionState}
                />
              )}
              {tab === 'settings' && isHost && (
                <SettingsPanel
                  calendar={liveCalendar}
                  accessToken={accessToken!}
                  participantUuid={participantSession.participantUuid}
                />
              )}
            </section>
          </div>
        </>
      )}
    </WorkspaceLayout>
  )
}
