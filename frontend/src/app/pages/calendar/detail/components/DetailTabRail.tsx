import { CalendarDays, Settings, Sparkles, Users } from 'lucide-react'

export type DetailTab = 'vote' | 'status' | 'participants' | 'settings'

interface DetailTabRailProps {
  activeTab: DetailTab
  isHost: boolean
  onChange: (tab: DetailTab) => void
}

export function DetailTabRail({ activeTab, isHost, onChange }: DetailTabRailProps) {
  const tabClass = (tab: DetailTab) => `flex items-center gap-[11px] rounded-[10px] border-0 px-3.5 py-3 text-left text-sm font-bold hover:bg-brand-100 hover:text-brand-500 max-[800px]:shrink-0 ${activeTab === tab ? 'bg-brand-100 text-brand-500' : 'bg-transparent text-[#587094]'}`

  return (
    <nav className="grid content-start gap-1 rounded-[15px] border border-[#e0eaf5] bg-white/80 p-2.5 max-[800px]:flex max-[800px]:overflow-x-auto" aria-label="캘린더 메뉴">
      <button type="button" className={tabClass('vote')} onClick={() => onChange('vote')}>
        <CalendarDays size={18} /> 날짜 투표
      </button>
      <button type="button" className={tabClass('status')} onClick={() => onChange('status')}>
        <Sparkles size={18} /> 유력 후보
      </button>
      <button type="button" className={tabClass('participants')} onClick={() => onChange('participants')}>
        <Users size={18} /> 참여자
      </button>
      {isHost && (
        <button type="button" className={tabClass('settings')} onClick={() => onChange('settings')}>
          <Settings size={18} /> 설정
        </button>
      )}
    </nav>
  )
}
