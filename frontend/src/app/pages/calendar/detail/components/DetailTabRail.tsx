import { CalendarDays, Check, Settings, Users } from 'lucide-react'

export type DetailTab = 'vote' | 'status' | 'participants' | 'settings'

interface DetailTabRailProps {
  activeTab: DetailTab
  isHost: boolean
  onChange: (tab: DetailTab) => void
}

export function DetailTabRail({ activeTab, isHost, onChange }: DetailTabRailProps) {
  return (
    <nav className="detail-tab-rail" aria-label="캘린더 메뉴">
      <button type="button" className={activeTab === 'vote' ? 'is-active' : ''} onClick={() => onChange('vote')}>
        <CalendarDays size={18} /> 날짜 투표
      </button>
      <button type="button" className={activeTab === 'status' ? 'is-active' : ''} onClick={() => onChange('status')}>
        <Check size={18} /> 투표 현황
      </button>
      <button type="button" className={activeTab === 'participants' ? 'is-active' : ''} onClick={() => onChange('participants')}>
        <Users size={18} /> 참여자
      </button>
      {isHost && (
        <button type="button" className={activeTab === 'settings' ? 'is-active' : ''} onClick={() => onChange('settings')}>
          <Settings size={18} /> 설정
        </button>
      )}
    </nav>
  )
}
