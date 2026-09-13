import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { useEffect, useReducer, useState } from 'react'
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom'

import { calendarDetailQuery } from '../../../../domains/calendar'
import {
  getParticipantSession,
  isLinkedMemberParticipantSession,
  isParticipantSessionUsable,
  participantsQuery,
  removeParticipantToken,
  runParticipantRequest,
  type ParticipantSession,
} from '../../../../domains/participant'
import {
  participantVotesQuery,
  initialVoteEditorState,
  submitVotes,
  VotePanel,
  VoteStatusPanel,
  voteStatusQuery,
  voteEditorReducer,
  type VoteInput,
} from '../../../../domains/vote'
import { useAuth } from '../../../providers/AuthProvider'
import { clearParticipantPrivateData, refreshVoteData } from '../../../cache/calendarCache'
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
  const [, rerenderSession] = useState(0)
  const session = getParticipantSession(slug)
  const location = useLocation()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { accessToken, status, userUuid } = useAuth()
  const currentUserUuid = status === 'authenticated' ? userUuid : null
  const memberIdentityUnavailable = isLinkedMemberParticipantSession(session)
    && (status === 'restoring' || status === 'restore-failed')
  const usableSession = !memberIdentityUnavailable && isParticipantSessionUsable(session, currentUserUuid) ? session : null
  const requestedTab = searchParams.get('tab')
  const requestedDetailTab: DetailTab = requestedTab && DETAIL_TABS.includes(requestedTab as DetailTab) ? requestedTab as DetailTab : 'vote'

  const calendarQuery = useQuery({ ...calendarDetailQuery(slug), enabled: Boolean(slug && usableSession) })
  const participants = useQuery({ ...participantsQuery(slug), enabled: Boolean(slug && usableSession) })
  const voteStatus = useQuery({ ...voteStatusQuery(slug), enabled: Boolean(slug && usableSession) })
  const ownVotes = useQuery({ ...participantVotesQuery(slug, usableSession?.participantUuid ?? ''), enabled: Boolean(slug && usableSession?.participantUuid) })
  const realtime = useCalendarRealtime(slug, usableSession?.participantToken, usableSession?.participantUuid)
  const [voteEditorState, voteEditorDispatch] = useReducer(voteEditorReducer, initialVoteEditorState)
  const editorSessionKey = `${slug}:${usableSession?.participantUuid ?? ''}`

  useEffect(() => {
    voteEditorDispatch({ type: 'RESET' })
  }, [editorSessionKey])

  useUnsavedVoteNavigationWarning(voteEditorState.isDirty)

  useEffect(() => {
    if (status === 'restoring' || status === 'restore-failed' || !session || usableSession) return
    removeParticipantToken(slug)
    clearParticipantPrivateData(queryClient, [{ slug, participantUuid: session.participantUuid }])
    rerenderSession((version) => version + 1)
  }, [queryClient, session, slug, status, usableSession])

  if (!slug) return <Navigate to="/" replace />
  if (memberIdentityUnavailable) return <WorkspaceLayout><section className="workspace-empty-state">{status === 'restore-failed' ? '네트워크 문제로 회원과 참여 세션을 확인하지 못했어요. 새로고침 후 다시 시도해주세요.' : '회원과 참여 세션을 확인하고 있어요.'}</section></WorkspaceLayout>
  if (!usableSession) return <Navigate to={`/c/${slug}/join`} replace />
  if (realtime.isDeleted) return <WorkspaceLayout><section className="workspace-empty-state"><h1>삭제된 캘린더예요.</h1><p>방장이 캘린더를 삭제해서 더 이상 참여할 수 없어요.</p><Link className="button button-primary" to="/">홈으로 돌아가기</Link></section></WorkspaceLayout>

  const calendar = calendarQuery.data?.calendar
  const liveCalendar = calendar && realtime.isClosed ? { ...calendar, is_closed: true } : calendar
  const isHost = Boolean(accessToken && liveCalendar?.hostParticipantUuid === usableSession.participantUuid)
  const tab = requestedDetailTab === 'settings' && !isHost ? 'vote' : requestedDetailTab
  const shareUrl = (location.state as DetailLocationState | null)?.shareUrl ?? `${window.location.origin}/c/${slug}/join`
  const changeTab = (nextTab: DetailTab) => setSearchParams(nextTab === 'vote' ? {} : { tab: nextTab })
  const updateSession = (_nextSession: ParticipantSession | null) => rerenderSession((version) => version + 1)

  const submitParticipantVotes = (votes: VoteInput[]) => runParticipantRequest({
    slug,
    session: usableSession,
    currentUserUuid,
    mainAccessToken: accessToken,
    onSessionChanged: updateSession,
    request: (participantToken) => submitVotes(slug, { votes }, participantToken),
  }).then((result) => refreshVoteData(queryClient, slug, usableSession.participantUuid).then(() => result))

  return <WorkspaceLayout sideContent={<DetailAside calendar={liveCalendar} participants={participants.data?.participants ?? []} voteStatus={voteStatus.data?.voteStatus ?? []} onlineUsers={realtime.onlineUsers} connectionState={realtime.connectionState} />}>
    <Link className="detail-back-link" to="/calendars"><ChevronLeft size={17} /> 내 캘린더로 돌아가기</Link>
    {calendarQuery.isPending ? <section className="workspace-panel calendar-feedback">캘린더를 불러오는 중이에요.</section> : calendarQuery.isError || !liveCalendar ? <section className="workspace-panel calendar-feedback"><h1>캘린더 정보를 불러오지 못했어요.</h1><button className="button button-secondary" type="button" onClick={() => void calendarQuery.refetch()}>다시 시도</button></section> : <>
      <CalendarHero calendar={liveCalendar} shareUrl={shareUrl} connectionState={realtime.connectionState} />
      <div className="detail-workspace-layout">
        <DetailTabRail activeTab={tab} isHost={isHost} onChange={changeTab} />
        <section className="detail-tab-content">
          {tab === 'vote' && <VotePanel isClosed={liveCalendar.is_closed} voteStatus={voteStatus.data?.voteStatus} ownVotes={ownVotes.data?.votes} loading={(!voteStatus.data && voteStatus.isPending) || (!ownVotes.data && ownVotes.isPending)} loadError={Boolean((voteStatus.isError && !voteStatus.data) || (ownVotes.isError && !ownVotes.data))} refetchError={Boolean((voteStatus.isRefetchError && voteStatus.data) || (ownVotes.isRefetchError && ownVotes.data))} state={voteEditorState} dispatch={voteEditorDispatch} onRetry={() => { void Promise.all([voteStatus.refetch(), ownVotes.refetch()]) }} onSubmit={submitParticipantVotes} onReentryRequired={() => rerenderSession((version) => version + 1)} />}
          {tab === 'status' && <VoteStatusPanel voteStatus={voteStatus.data?.voteStatus ?? []} participantsCount={participants.data?.count ?? 0} loading={voteStatus.isPending || participants.isPending} />}
          {tab === 'participants' && <ParticipantsPanel slug={slug} participants={participants.data?.participants ?? []} session={usableSession} currentUserUuid={currentUserUuid} hostUuid={liveCalendar.hostParticipantUuid} isHost={isHost} accessToken={accessToken} onlineUsers={realtime.onlineUsers} connectionState={realtime.connectionState} onSessionChanged={updateSession} />}
          {tab === 'settings' && isHost && <SettingsPanel calendar={liveCalendar} accessToken={accessToken!} participantUuid={usableSession.participantUuid} />}
        </section>
      </div>
    </>}
  </WorkspaceLayout>
}
