import type { ReactNode } from 'react'
import { CalendarDays, ListChecks, Plus, Users } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import { Footer } from '../../../shared/ui/Footer'
import { Header } from '../../../shared/ui/Header'
import { useAuth } from '../../providers/AuthProvider'

interface WorkspaceLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  action?: ReactNode
  sideContent?: ReactNode
  hideRail?: boolean
}

export function WorkspaceLayout({
  children,
  title,
  description,
  action,
  sideContent,
  hideRail = false,
}: WorkspaceLayoutProps) {
  const { status, user } = useAuth()

  return (
    <div className="workspace-app">
      <Header workspace isAuthenticated={status === 'authenticated'} displayName={user?.nickname} />
      <main className={`workspace-main${hideRail ? ' is-public' : ''}`}>
        {!hideRail && <aside className="workspace-rail" aria-label="캘린더 메뉴">
          <p className="workspace-rail-label">CALENDAR SPACE</p>
          <nav>
            <NavLink to="/calendars" end>
              <CalendarDays size={18} /> 내 캘린더
            </NavLink>
            <NavLink to="/calendars/new">
              <Plus size={18} /> 새 캘린더
            </NavLink>
            <a href="/#guide">
              <ListChecks size={18} /> 이용 방법
            </a>
          </nav>
          <div className="workspace-rail-note">
            <Users size={20} />
            <strong>시간을 모아보세요</strong>
            <span>링크 하나로 모두가 가능한 날을 찾을 수 있어요.</span>
          </div>
        </aside>}

        <section className="workspace-content">
          {title && (
            <header className="workspace-page-heading">
              <div>
                <p className="eyebrow">MOIM CALENDAR</p>
                <h1>{title}</h1>
                {description && <p>{description}</p>}
              </div>
              {action}
            </header>
          )}
          {children}
        </section>

        {sideContent && <aside className="workspace-aside">{sideContent}</aside>}
      </main>
      <Footer />
    </div>
  )
}

export function LoginRequired() {
  return (
    <section className="workspace-empty-state">
      <p className="eyebrow">LOGIN REQUIRED</p>
      <h1>내 캘린더를 보려면 로그인이 필요해요.</h1>
      <p>Google 계정으로 로그인하면 만든 캘린더를 한곳에서 관리할 수 있어요.</p>
      <Link className="button button-primary" to="/login">로그인하기</Link>
    </section>
  )
}
