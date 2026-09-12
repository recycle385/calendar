import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Check, ChevronLeft, Crown, LogOut, Settings, Share2, Trash2, UserMinus, Users } from 'lucide-react'
import { useEffect, useReducer, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { calendarDetailQuery, closeCalendar, deleteCalendar, updateCalendar, type Calendar } from '../../../domains/calendar'
import {
  deleteParticipantByHost,
  deleteParticipantSelf,
  getParticipantSession,
  isLinkedMemberParticipantSession,
  isParticipantSessionUsable,
  participantsQuery,
  removeParticipantToken,
  runParticipantRequest,
  type Participant,
  type ParticipantSession,
} from '../../../domains/participant'
import {
  participantVotesQuery,
  initialVoteEditorState,
  submitVotes,
  VotePanel,
  VoteRecommendations,
  VoteStatusPanel,
  voteStatusQuery,
  voteEditorReducer,
  type DateVoteStatus,
  type VoteInput,
} from '../../../domains/vote'
import { assetUrl, hideUnavailableAsset } from '../../../shared/assets/assetUrl'
import { formatDate, formatPercent } from '../../../shared/utils/format'
import { useAuth } from '../../providers/AuthProvider'
import { clearDeletedCalendarData, clearParticipantPrivateData, refreshCalendarData, refreshParticipantData, refreshVoteData } from '../../cache/calendarCache'
import { WorkspaceLayout } from '../components/WorkspaceLayout'
import { PLACEHOLDER_IMAGE_PATH } from './calendarHelpers'
import { useCalendarRealtime, type OnlineCalendarUser, type RealtimeConnectionState } from './useCalendarRealtime'

type DetailTab = 'vote' | 'status' | 'participants' | 'settings'
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
        <nav className="detail-tab-rail" aria-label="캘린더 메뉴">
          <button type="button" className={tab === 'vote' ? 'is-active' : ''} onClick={() => changeTab('vote')}><CalendarDays size={18} /> 날짜 투표</button>
          <button type="button" className={tab === 'status' ? 'is-active' : ''} onClick={() => changeTab('status')}><Check size={18} /> 투표 현황</button>
          <button type="button" className={tab === 'participants' ? 'is-active' : ''} onClick={() => changeTab('participants')}><Users size={18} /> 참여자</button>
          {isHost && <button type="button" className={tab === 'settings' ? 'is-active' : ''} onClick={() => changeTab('settings')}><Settings size={18} /> 설정</button>}
        </nav>
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

function useUnsavedVoteNavigationWarning(isDirty: boolean) {
  const allowNavigation = useRef(false)

  useEffect(() => {
    allowNavigation.current = false
    if (!isDirty) return

    const confirmDiscard = () => window.confirm(
      '저장하지 않은 투표 변경이 있어요. 변경을 버리고 이동할까요?\n취소하면 계속 편집할 수 있어요.',
    )
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowNavigation.current) return
      event.preventDefault()
    }
    const guardLinkNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target
      const link = target instanceof Element ? target.closest('a[href]') : null
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank' || link.hasAttribute('download')) return

      const destination = new URL(link.href, window.location.href)
      if (destination.href === window.location.href) return
      if (!confirmDiscard()) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      allowNavigation.current = true
    }

    window.addEventListener('beforeunload', warnBeforeUnload)
    document.addEventListener('click', guardLinkNavigation, true)
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload)
      document.removeEventListener('click', guardLinkNavigation, true)
    }
  }, [isDirty])
}

function CalendarHero({ calendar, shareUrl, connectionState }: { calendar: Calendar; shareUrl: string; connectionState: RealtimeConnectionState }) {
  const [copied, setCopied] = useState(false)
  async function copyLink() {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800) }
    catch { window.prompt('아래 참여 링크를 복사해주세요.', shareUrl) }
  }
  return <section className="workspace-panel detail-calendar-hero"><img src={assetUrl(PLACEHOLDER_IMAGE_PATH)} alt={`${calendar.title} 대표 이미지`} onError={hideUnavailableAsset} /><div className="detail-calendar-hero-body"><div className="detail-status-row"><span className={calendar.is_closed ? 'workspace-status is-closed' : 'workspace-status'}>{calendar.is_closed ? '마감됨' : '진행 중'}</span><span className={`realtime-state is-${connectionState}`}><i />{connectionState === 'connected' ? '실시간 연결됨' : connectionState === 'connecting' ? '실시간 연결 중' : '연결 확인 필요'}</span></div><h1>{calendar.title}</h1><p>{calendar.description || '참여자와 가능한 날짜를 선택해보세요.'}</p><span className="detail-hero-date"><CalendarDays size={16} /> {formatDate(calendar.start_date)} — {formatDate(calendar.end_date)}</span></div><button type="button" className="button button-secondary detail-share-button" onClick={() => void copyLink()}>{copied ? <><Check size={17} /> 복사됨</> : <><Share2 size={17} /> 링크 공유</>}</button></section>
}

interface ParticipantsPanelProps { slug: string; participants: Participant[]; session: ParticipantSession; currentUserUuid: string | null; hostUuid: string; isHost: boolean; accessToken: string | null; onlineUsers: OnlineCalendarUser[] | null; connectionState: RealtimeConnectionState; onSessionChanged: (session: ParticipantSession | null) => void }
function ParticipantsPanel({ slug, participants, session, currentUserUuid, hostUuid, isHost, accessToken, onlineUsers, connectionState, onSessionChanged }: ParticipantsPanelProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const leaveMutation = useMutation({ mutationFn: () => runParticipantRequest({ slug, session, currentUserUuid, mainAccessToken: accessToken, onSessionChanged, request: (token) => deleteParticipantSelf(slug, token) }), onSuccess: () => { removeParticipantToken(slug); clearParticipantPrivateData(queryClient, [{ slug, participantUuid: session.participantUuid }]); navigate(`/c/${slug}/join`, { replace: true }) } })
  const kickMutation = useMutation({ mutationFn: (uuid: string) => deleteParticipantByHost(slug, uuid, accessToken!), onSuccess: () => void refreshParticipantData(queryClient, slug, session.participantUuid) })
  const onlineUuids = new Set(onlineUsers?.map((user) => user.sub) ?? [])
  return <section className="workspace-panel participants-panel"><div className="detail-panel-heading"><div><h2>참여자 ({participants.length})</h2><p>함께 일정을 맞추고 있는 사람들이에요.</p></div>{session.participantUuid !== hostUuid && <button className="button button-secondary danger-outline" type="button" disabled={leaveMutation.isPending} onClick={() => { if (window.confirm('이 캘린더에서 나갈까요?')) leaveMutation.mutate() }}><LogOut size={16} /> 나가기</button>}</div><div className="participants-list">{participants.map((participant) => <article key={participant.uuid}><span className="participant-avatar" style={{ backgroundColor: participant.color_code }}>{participant.nickname.slice(0, 1)}</span><div><h3>{participant.nickname} {participant.uuid === hostUuid && <Crown size={15} />}<span className={`participant-presence${connectionState === 'connected' && onlineUuids.has(participant.uuid) ? ' is-online' : ''}`}><i />{connectionState !== 'connected' ? '확인 중' : onlineUuids.has(participant.uuid) ? '온라인' : '오프라인'}</span></h3><p>투표 참여율 {formatPercent(participant.vote_rate)} · {participant.vote_count}/{participant.total_dates}일</p></div>{isHost && participant.uuid !== hostUuid && <button type="button" className="participant-kick" aria-label={`${participant.nickname} 내보내기`} disabled={kickMutation.isPending} onClick={() => { if (window.confirm(`${participant.nickname}님을 내보낼까요?`)) kickMutation.mutate(participant.uuid) }}><UserMinus size={18} /></button>}</article>)}</div>{leaveMutation.isError && <p className="form-error workspace-request-error">캘린더에서 나가지 못했어요. 다시 참여한 뒤 시도해주세요.</p>}{kickMutation.isError && <p className="form-error workspace-request-error">참여자를 내보내지 못했어요. 다시 시도해주세요.</p>}</section>
}

function SettingsPanel({ calendar, accessToken, participantUuid }: { calendar: Calendar; accessToken: string; participantUuid: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(calendar.title)
  const [description, setDescription] = useState(calendar.description ?? '')
  useEffect(() => { setTitle(calendar.title); setDescription(calendar.description ?? '') }, [calendar.description, calendar.title])
  const updateMutation = useMutation({ mutationFn: () => updateCalendar(calendar.slug, { title: title.trim(), description: description.trim() || null }, accessToken), onSuccess: () => void refreshCalendarData(queryClient, calendar.slug, participantUuid) })
  const closeMutation = useMutation({ mutationFn: () => closeCalendar(calendar.slug, accessToken), onSuccess: () => void refreshCalendarData(queryClient, calendar.slug, participantUuid) })
  const deleteMutation = useMutation({ mutationFn: () => deleteCalendar(calendar.slug, accessToken), onSuccess: () => { removeParticipantToken(calendar.slug); void clearDeletedCalendarData(queryClient, calendar.slug); navigate('/calendars', { replace: true }) } })
  return <section className="workspace-panel settings-panel"><div className="detail-panel-heading"><div><h2>캘린더 설정</h2><p>방장만 캘린더 정보를 변경하거나 마감할 수 있어요.</p></div></div><label><span>캘린더 제목</span><input value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} /></label><label><span>설명</span><textarea value={description} maxLength={500} rows={4} onChange={(event) => setDescription(event.target.value)} /></label>{updateMutation.isError && <p className="form-error">저장하지 못했어요. 다시 시도해주세요.</p>}<button className="button button-primary" type="button" disabled={!title.trim() || updateMutation.isPending} onClick={() => updateMutation.mutate()}>{updateMutation.isPending ? '저장 중…' : '변경 사항 저장'}</button><hr /><div className="settings-danger-zone"><div><h3>투표 마감</h3><p>마감하면 참여자는 더 이상 투표를 바꿀 수 없어요.</p></div><button className="button button-secondary" type="button" disabled={calendar.is_closed || closeMutation.isPending} onClick={() => { if (window.confirm('투표를 마감할까요? 이 작업은 되돌릴 수 없어요.')) closeMutation.mutate() }}>{calendar.is_closed ? '마감됨' : '투표 마감하기'}</button></div><div className="settings-danger-zone"><div><h3>캘린더 삭제</h3><p>캘린더와 참여 기록을 삭제합니다.</p></div><button className="button danger-button" type="button" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm('이 캘린더를 삭제할까요? 되돌릴 수 없어요.')) deleteMutation.mutate() }}><Trash2 size={16} /> 삭제</button></div></section>
}

function DetailAside({ calendar, participants, voteStatus, onlineUsers, connectionState }: { calendar?: Calendar; participants: Participant[]; voteStatus: DateVoteStatus[]; onlineUsers: OnlineCalendarUser[] | null; connectionState: RealtimeConnectionState }) {
  const onlineUuids = new Set(onlineUsers?.map((user) => user.sub) ?? [])
  return <>{calendar && <section className="workspace-aside-card detail-aside-image"><img src={assetUrl(PLACEHOLDER_IMAGE_PATH)} alt="캘린더 이미지" onError={hideUnavailableAsset} /><p className="eyebrow">CALENDAR STATUS</p><strong>{calendar.is_closed ? '투표가 마감되었어요.' : '참여자의 응답을 기다리고 있어요.'}</strong></section>}<section className="workspace-aside-card participant-summary-card"><h2>참여자 ({participants.length})</h2>{participants.slice(0, 5).map((participant) => <div key={participant.uuid}><span className="participant-avatar" style={{ backgroundColor: participant.color_code }}>{participant.nickname.slice(0, 1)}</span><strong>{participant.nickname}</strong><i className={connectionState === 'connected' && onlineUuids.has(participant.uuid) ? 'is-online' : ''} title={connectionState === 'connected' && onlineUuids.has(participant.uuid) ? '온라인' : '오프라인 또는 확인 중'} /></div>)}</section><VoteRecommendations voteStatus={voteStatus} /></>
}
