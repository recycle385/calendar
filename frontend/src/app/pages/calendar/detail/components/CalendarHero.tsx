import { CalendarDays, Check, Share2 } from 'lucide-react'
import { useState } from 'react'

import type { Calendar } from '../../../../../domains/calendar'
import { assetUrl, hideUnavailableAsset } from '../../../../../shared/assets/assetUrl'
import { formatDate } from '../../../../../shared/utils/format'
import { PLACEHOLDER_IMAGE_PATH } from '../../calendarHelpers'
import type { RealtimeConnectionState } from '../hooks/useCalendarRealtime'

interface CalendarHeroProps {
  calendar: Calendar
  shareUrl: string
  connectionState: RealtimeConnectionState
}

export function CalendarHero({ calendar, shareUrl, connectionState }: CalendarHeroProps) {
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

  return (
    <section className="workspace-panel detail-calendar-hero">
      <img
        src={assetUrl(PLACEHOLDER_IMAGE_PATH)}
        alt={`${calendar.title} 대표 이미지`}
        onError={hideUnavailableAsset}
      />
      <div className="detail-calendar-hero-body">
        <div className="detail-status-row">
          <span className={calendar.is_closed ? 'workspace-status is-closed' : 'workspace-status'}>
            {calendar.is_closed ? '마감됨' : '진행 중'}
          </span>
          <span className={`realtime-state is-${connectionState}`}>
            <i />
            {connectionState === 'connected'
              ? '실시간 연결됨'
              : connectionState === 'connecting'
                ? '실시간 연결 중'
                : '연결 확인 필요'}
          </span>
        </div>
        <h1>{calendar.title}</h1>
        <p>{calendar.description || '참여자와 가능한 날짜를 선택해보세요.'}</p>
        <span className="detail-hero-date">
          <CalendarDays size={16} /> {formatDate(calendar.start_date)} — {formatDate(calendar.end_date)}
        </span>
      </div>
      <button type="button" className="button button-secondary detail-share-button" onClick={() => void copyLink()}>
        {copied ? <><Check size={17} /> 복사됨</> : <><Share2 size={17} /> 링크 공유</>}
      </button>
    </section>
  )
}
