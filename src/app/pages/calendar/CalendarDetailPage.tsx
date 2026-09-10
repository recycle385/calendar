import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays, Check, ChevronLeft, ChevronRight, Clipboard, Crown, LogOut, MoreHorizontal,
  Pencil, Settings, Share2, Trash2, UserMinus, Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { closeCalendar, deleteCalendar, getCalendarBySlug, updateCalendar, type Calendar } from '../../../domains/calendar'
import {
  deleteParticipantByHost,
  deleteParticipantSelf,
  getParticipantSession,
  getParticipants,
  removeParticipantToken,
  type Participant,
} from '../../../domains/participant'
import { getParticipantVotes, getVoteStatus, submitVotes, type DateVoteStatus, type VoteType } from '../../../domains/vote'
import { assetUrl } from '../../../shared/assets/assetUrl'
import { formatDate, formatPercent } from '../../../shared/utils/format'
import { useAuth } from '../../providers/AuthProvider'
import { WorkspaceLayout } from '../components/WorkspaceLayout'
import { PLACEHOLDER_IMAGE_PATH } from './calendarHelpers'

type DetailTab = 'vote' | 'status' | 'participants' | 'settings'
const DETAIL_TABS: DetailTab[] = ['vote', 'status', 'participants', 'settings']
const VOTE_TOOL: Array<{ value: VoteType; label: string; className: string }> = [
  { value: 'available', label: '가능', className: 'is-available' },
  { value: 'maybe', label: '애매함', className: 'is-maybe' },
  { value: 'unavailable', label: '불가', className: 'is-unavailable' },
]

interface DetailLocationState { shareUrl?: string }

export function CalendarDetailPage() {
  const { slug = '' } = useParams()
  const session = getParticipantSession(slug)
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const tab: DetailTab = requestedTab && DETAIL_TABS.includes(requestedTab as DetailTab) ? requestedTab as DetailTab : 'vote'
  const { accessToken } = useAuth()
  const calendarQuery = useQuery({ queryKey: ['calendar', slug], queryFn: () => getCalendarBySlug(slug), enabled: Boolean(slug && session) })
  const participantsQuery = useQuery({ queryKey: ['calendar', slug, 'participants'], queryFn: () => getParticipants(slug), enabled: Boolean(slug && session) })
  const voteStatusQuery = useQuery({ queryKey: ['calendar', slug, 'vote-status'], queryFn: () => getVoteStatus(slug), enabled: Boolean(slug && session) })
  const ownVotesQuery = useQuery({ queryKey: ['calendar', slug, 'votes', session?.participantUuid], queryFn: () => getParticipantVotes(slug, session!.participantUuid), enabled: Boolean(slug && session?.participantUuid) })

  if (!slug) return <Navigate to="/" replace />
  if (!session) return <Navigate to={`/c/${slug}/join`} replace />

  const calendar = calendarQuery.data?.calendar
  const isHost = Boolean(accessToken && calendar?.hostParticipantUuid === session.participantUuid)
  const shareUrl = (location.state as DetailLocationState | null)?.shareUrl ?? `${window.location.origin}/c/${slug}/join`
  const changeTab = (nextTab: DetailTab) => setSearchParams(nextTab === 'vote' ? {} : { tab: nextTab })
  const pageTitle = calendar?.title ?? '캘린더'

  return (
    <WorkspaceLayout
      sideContent={<DetailAside calendar={calendar} participants={participantsQuery.data?.participants ?? []} voteStatus={voteStatusQuery.data?.voteStatus ?? []} />}
    >
      <Link className="detail-back-link" to="/calendars"><ChevronLeft size={17} /> 내 캘린더로 돌아가기</Link>
      {calendarQuery.isPending ? <section className="workspace-panel calendar-feedback">캘린더를 불러오는 중이에요.</section> : calendarQuery.isError || !calendar ? <section className="workspace-panel calendar-feedback"><h1>캘린더 정보를 불러오지 못했어요.</h1><button className="button button-secondary" type="button" onClick={() => void calendarQuery.refetch()}>다시 시도</button></section> : <>
        <CalendarHero calendar={calendar} shareUrl={shareUrl} />
        <div className="detail-workspace-layout">
          <nav className="detail-tab-rail" aria-label="캘린더 메뉴">
            <button type="button" className={tab === 'vote' ? 'is-active' : ''} onClick={() => changeTab('vote')}><CalendarDays size={18} /> 날짜 투표</button>
            <button type="button" className={tab === 'status' ? 'is-active' : ''} onClick={() => changeTab('status')}><Check size={18} /> 투표 현황</button>
            <button type="button" className={tab === 'participants' ? 'is-active' : ''} onClick={() => changeTab('participants')}><Users size={18} /> 참여자</button>
            {isHost && <button type="button" className={tab === 'settings' ? 'is-active' : ''} onClick={() => changeTab('settings')}><Settings size={18} /> 설정</button>}
          </nav>
          <section className="detail-tab-content">
            {tab === 'vote' && <VotePanel slug={slug} calendar={calendar} voteStatus={voteStatusQuery.data?.voteStatus ?? []} ownVotes={ownVotesQuery.data?.votes ?? []} participantToken={session.participantToken} loading={voteStatusQuery.isPending || ownVotesQuery.isPending} />}
            {tab === 'status' && <StatusPanel voteStatus={voteStatusQuery.data?.voteStatus ?? []} participantsCount={participantsQuery.data?.count ?? 0} loading={voteStatusQuery.isPending || participantsQuery.isPending} />}
            {tab === 'participants' && <ParticipantsPanel slug={slug} participants={participantsQuery.data?.participants ?? []} selfUuid={session.participantUuid} hostUuid={calendar.hostParticipantUuid} isHost={isHost} accessToken={accessToken} />}
            {tab === 'settings' && isHost && <SettingsPanel calendar={calendar} accessToken={accessToken!} />}
          </section>
        </div>
      </>}
    </WorkspaceLayout>
  )
}

function CalendarHero({ calendar, shareUrl }: { calendar: Calendar; shareUrl: string }) {
  const [copied, setCopied] = useState(false)
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt('아래 참여 링크를 복사해주세요.', shareUrl)
    }
  }

  return <section className="workspace-panel detail-calendar-hero">
    <img src={assetUrl(PLACEHOLDER_IMAGE_PATH)} alt={`${calendar.title} 대표 이미지`} />
    <div className="detail-calendar-hero-body"><span className={calendar.is_closed ? 'workspace-status is-closed' : 'workspace-status'}>{calendar.is_closed ? '마감됨' : '진행 중'}</span><h1>{calendar.title}</h1><p>{calendar.description || '참여자와 가능한 날짜를 선택해보세요.'}</p><span className="detail-hero-date"><CalendarDays size={16} /> {formatDate(calendar.start_date)} — {formatDate(calendar.end_date)}</span></div>
    <button type="button" className="button button-secondary detail-share-button" onClick={() => void copyLink()}>{copied ? <><Check size={17} /> 복사됨</> : <><Share2 size={17} /> 링크 공유</>}</button>
  </section>
}

interface VotePanelProps { slug: string; calendar: Calendar; voteStatus: DateVoteStatus[]; ownVotes: Array<{ date_value: string; vote_type: VoteType }>; participantToken: string; loading: boolean }

function VotePanel({ slug, calendar, voteStatus, ownVotes, participantToken, loading }: VotePanelProps) {
  const queryClient = useQueryClient()
  const [tool, setTool] = useState<VoteType>('available')
  const [draft, setDraft] = useState<Record<string, VoteType>>({})
  const [isDirty, setIsDirty] = useState(false)
  const enabledDateSet = useMemo(
    () => new Set(voteStatus.filter((item) => item.is_enabled).map((item) => item.date_value.slice(0, 10))),
    [voteStatus],
  )
  useEffect(() => {
    if (!isDirty) {
      setDraft(Object.fromEntries(ownVotes
        .filter((vote) => enabledDateSet.has(vote.date_value.slice(0, 10)))
        .map((vote) => [vote.date_value.slice(0, 10), vote.vote_type])))
    }
  }, [enabledDateSet, isDirty, ownVotes])
  const submitMutation = useMutation({
    mutationFn: () => submitVotes(slug, { votes: Object.entries(draft)
      .filter(([date]) => enabledDateSet.has(date))
      .map(([date, voteType]) => ({ date, voteType })) }, participantToken),
    onSuccess: () => {
      setIsDirty(false)
      void queryClient.invalidateQueries({ queryKey: ['calendar', slug, 'vote-status'] })
      void queryClient.invalidateQueries({ queryKey: ['calendar', slug, 'votes'] })
    },
  })
  const enabledDates = voteStatus.filter((item) => item.is_enabled)
  function choose(date: string) {
    if (draft[date] === tool) {
      clear(date)
      return
    }
    setDraft((current) => ({ ...current, [date]: tool }))
    setIsDirty(true)
  }
  function clear(date: string) { setDraft((current) => { const next = { ...current }; delete next[date]; return next }); setIsDirty(true) }

  if (loading) return <section className="workspace-panel calendar-feedback">내 투표 정보를 불러오는 중이에요.</section>
  if (calendar.is_closed) return <section className="workspace-panel calendar-feedback"><CalendarDays size={32} /><h2>투표가 마감되었어요.</h2><p>투표 현황에서 함께 고른 날짜를 확인할 수 있어요.</p></section>
  if (enabledDates.length === 0) return <section className="workspace-panel calendar-feedback"><CalendarDays size={32} /><h2>선택 가능한 날짜가 없어요.</h2><p>방장이 투표 기간을 조정하면 이곳에 표시돼요.</p></section>

  return <section className="workspace-panel vote-panel"><div className="detail-panel-heading"><div><h2>날짜 투표</h2><p>가능한 날짜를 누르고 상태를 표시해주세요. 여러 날짜를 선택할 수 있어요.</p></div><span>{Object.keys(draft).length}개 선택</span></div>
    <div className="vote-tools" aria-label="투표 상태 선택">{VOTE_TOOL.map((item) => <button key={item.value} type="button" className={`${item.className}${tool === item.value ? ' is-selected' : ''}`} onClick={() => setTool(item.value)}><i />{item.label}</button>)}</div>
    <div className="vote-date-grid">{enabledDates.map((item) => { const date = item.date_value.slice(0, 10); const selected = draft[date]; return <button type="button" className={`vote-date-cell${selected ? ` ${VOTE_TOOL.find((toolItem) => toolItem.value === selected)?.className}` : ''}`} key={date} onClick={() => choose(date)}><span>{formatDate(date)}</span><strong>{selected ? VOTE_TOOL.find((toolItem) => toolItem.value === selected)?.label : '선택 안 함'}</strong>{selected && <small>같은 상태를 누르면 해제돼요</small>}</button> })}</div>
    {submitMutation.isError && <p className="form-error workspace-request-error">투표를 저장하지 못했어요. 네트워크를 확인한 뒤 다시 시도해주세요.</p>}
    <div className="vote-submit-row"><p>비워둔 날짜는 선택하지 않은 것으로 저장돼요.</p><button className="button button-primary" type="button" disabled={submitMutation.isPending} onClick={() => submitMutation.mutate()}>{submitMutation.isPending ? '저장 중…' : <><Check size={18} /> 투표 저장하기</>}</button></div>
  </section>
}

function StatusPanel({ voteStatus, participantsCount, loading }: { voteStatus: DateVoteStatus[]; participantsCount: number; loading: boolean }) {
  const ranked = useMemo(() => voteStatus.filter((item) => item.is_enabled).map((item) => ({ item, available: item.votes.filter((vote) => vote.vote_type === 'available').length, maybe: item.votes.filter((vote) => vote.vote_type === 'maybe').length, unavailable: item.votes.filter((vote) => vote.vote_type === 'unavailable').length })).sort((left, right) => right.available - left.available || right.maybe - left.maybe || left.item.date_value.localeCompare(right.item.date_value)), [voteStatus])
  if (loading) return <section className="workspace-panel calendar-feedback">투표 현황을 불러오는 중이에요.</section>
  return <section className="workspace-panel status-panel"><div className="detail-panel-heading"><div><h2>투표 현황</h2><p>가능 응답이 많은 순서로 날짜를 추천해요.</p></div></div>{ranked.length === 0 ? <div className="calendar-feedback">아직 표시할 날짜가 없어요.</div> : <div className="status-list">{ranked.map(({ item, available, maybe, unavailable }, index) => <article key={item.date_option_id}><span className="status-rank">{index + 1}</span><div><h3>{formatDate(item.date_value)}</h3><p>아직 응답하지 않음 {Math.max(0, participantsCount - item.votes.length)}명</p></div><div className="status-counts"><span className="is-available">가능 {available}</span><span className="is-maybe">애매 {maybe}</span><span className="is-unavailable">불가 {unavailable}</span></div></article>)}</div>}</section>
}

function ParticipantsPanel({ slug, participants, selfUuid, hostUuid, isHost, accessToken }: { slug: string; participants: Participant[]; selfUuid: string; hostUuid: string; isHost: boolean; accessToken: string | null }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const leaveMutation = useMutation({ mutationFn: () => deleteParticipantSelf(slug, getParticipantSession(slug)!.participantToken), onSuccess: () => { removeParticipantToken(slug); navigate(`/c/${slug}/join`, { replace: true }) } })
  const kickMutation = useMutation({ mutationFn: (uuid: string) => deleteParticipantByHost(slug, uuid, accessToken!), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['calendar', slug, 'participants'] }) })
  return <section className="workspace-panel participants-panel"><div className="detail-panel-heading"><div><h2>참여자 ({participants.length})</h2><p>함께 일정을 맞추고 있는 사람들이에요.</p></div>{selfUuid !== hostUuid && <button className="button button-secondary danger-outline" type="button" disabled={leaveMutation.isPending} onClick={() => { if (window.confirm('이 캘린더에서 나갈까요?')) leaveMutation.mutate() }}><LogOut size={16} /> 나가기</button>}</div><div className="participants-list">{participants.map((participant) => <article key={participant.uuid}><span className="participant-avatar" style={{ backgroundColor: participant.color_code }}>{participant.nickname.slice(0, 1)}</span><div><h3>{participant.nickname} {participant.uuid === hostUuid && <Crown size={15} />}</h3><p>투표 참여율 {formatPercent(participant.vote_rate)} · {participant.vote_count}/{participant.total_dates}일</p></div>{isHost && participant.uuid !== hostUuid && <button type="button" className="participant-kick" aria-label={`${participant.nickname} 내보내기`} disabled={kickMutation.isPending} onClick={() => { if (window.confirm(`${participant.nickname}님을 내보낼까요?`)) kickMutation.mutate(participant.uuid) }}><UserMinus size={18} /></button>}</article>)}</div>{leaveMutation.isError && <p className="form-error workspace-request-error">캘린더에서 나가지 못했어요. 다시 시도해주세요.</p>}{kickMutation.isError && <p className="form-error workspace-request-error">참여자를 내보내지 못했어요. 다시 시도해주세요.</p>}</section>
}

function SettingsPanel({ calendar, accessToken }: { calendar: Calendar; accessToken: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(calendar.title)
  const [description, setDescription] = useState(calendar.description ?? '')
  useEffect(() => { setTitle(calendar.title); setDescription(calendar.description ?? '') }, [calendar.description, calendar.title])
  const updateMutation = useMutation({ mutationFn: () => updateCalendar(calendar.slug, { title: title.trim(), description: description.trim() || null }, accessToken), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['calendar', calendar.slug] }) })
  const closeMutation = useMutation({ mutationFn: () => closeCalendar(calendar.slug, accessToken), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['calendar', calendar.slug] }) })
  const deleteMutation = useMutation({ mutationFn: () => deleteCalendar(calendar.slug, accessToken), onSuccess: () => navigate('/calendars', { replace: true }) })
  return <section className="workspace-panel settings-panel"><div className="detail-panel-heading"><div><h2>캘린더 설정</h2><p>방장만 캘린더 정보를 변경하거나 마감할 수 있어요.</p></div></div><label><span>캘린더 제목</span><input value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} /></label><label><span>설명</span><textarea value={description} maxLength={500} rows={4} onChange={(event) => setDescription(event.target.value)} /></label>{updateMutation.isError && <p className="form-error">저장하지 못했어요. 다시 시도해주세요.</p>}<button className="button button-primary" type="button" disabled={!title.trim() || updateMutation.isPending} onClick={() => updateMutation.mutate()}>{updateMutation.isPending ? '저장 중…' : '변경 사항 저장'}</button><hr /><div className="settings-danger-zone"><div><h3>투표 마감</h3><p>마감하면 참여자는 더 이상 투표를 바꿀 수 없어요.</p></div><button className="button button-secondary" type="button" disabled={calendar.is_closed || closeMutation.isPending} onClick={() => { if (window.confirm('투표를 마감할까요? 이 작업은 되돌릴 수 없어요.')) closeMutation.mutate() }}>{calendar.is_closed ? '마감됨' : '투표 마감하기'}</button></div><div className="settings-danger-zone"><div><h3>캘린더 삭제</h3><p>캘린더와 참여 기록을 삭제합니다.</p></div><button className="button danger-button" type="button" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm('이 캘린더를 삭제할까요? 되돌릴 수 없어요.')) deleteMutation.mutate() }}><Trash2 size={16} /> 삭제</button></div></section>
}

function DetailAside({ calendar, participants, voteStatus }: { calendar?: Calendar; participants: Participant[]; voteStatus: DateVoteStatus[] }) {
  const top = useMemo(() => voteStatus.filter((item) => item.is_enabled).map((item) => ({ date: item.date_value, count: item.votes.filter((vote) => vote.vote_type === 'available').length })).sort((left, right) => right.count - left.count || left.date.localeCompare(right.date)).slice(0, 3), [voteStatus])
  return <>{calendar && <section className="workspace-aside-card detail-aside-image"><img src={assetUrl(PLACEHOLDER_IMAGE_PATH)} alt="캘린더 이미지" /><p className="eyebrow">CALENDAR STATUS</p><strong>{calendar.is_closed ? '투표가 마감되었어요.' : '참여자의 응답을 기다리고 있어요.'}</strong></section>}<section className="workspace-aside-card participant-summary-card"><h2>참여자 ({participants.length})</h2>{participants.slice(0, 5).map((participant) => <div key={participant.uuid}><span className="participant-avatar" style={{ backgroundColor: participant.color_code }}>{participant.nickname.slice(0, 1)}</span><strong>{participant.nickname}</strong></div>)}</section><section className="workspace-aside-card recommendation-card"><h2>추천 날짜 TOP 3</h2>{top.length ? top.map((item, index) => <div key={item.date}><span>{index + 1}</span><strong>{formatDate(item.date)}</strong><small>가능 {item.count}명</small></div>) : <p>투표가 모이면 추천 날짜가 표시돼요.</p>}</section></>
}
