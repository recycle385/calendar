import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Brand } from './Brand';

interface HeaderProps {
  isAuthenticated?: boolean;
  displayName?: string | null;
}

export function Header({ isAuthenticated = false, displayName }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Brand />

        <nav className="desktop-nav" aria-label="주 메뉴">
          <a href="#features">서비스 소개</a>
          <a href="#guide">이용 방법</a>
          <a href="#faq">자주 묻는 질문</a>
          <a className="desktop-extra-nav" href="#examples">활용 예시</a>
        </nav>

        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <a className="login-link" href="#my-calendars">{displayName ?? '회원'}님</a>
              <a className="button button-primary button-small" href="#my-calendars">내 캘린더</a>
            </>
          ) : (
            <>
              <a className="login-link" href="/login">로그인</a>
              <a className="button button-primary button-small" href="/login">
                <span className="google-dot header-google">G</span>
                <span className="header-label-wide">Google로 시작하기</span>
                <span className="header-label-tablet">시작하기</span>
              </a>
            </>
          )}
        </div>

        <button
          className="mobile-menu-button"
          type="button"
          aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav
        className={`mobile-nav${mobileMenuOpen ? ' is-open' : ''}`}
        aria-label="모바일 주 메뉴"
      >
        <a href="#features" onClick={closeMobileMenu}>서비스 소개</a>
        <a href="#guide" onClick={closeMobileMenu}>이용 방법</a>
        <a href="#faq" onClick={closeMobileMenu}>자주 묻는 질문</a>
        {isAuthenticated ? (
          <>
            <a href="#my-calendars" onClick={closeMobileMenu}>{displayName ?? '회원'}님</a>
            <a className="mobile-nav-primary" href="#my-calendars" onClick={closeMobileMenu}>내 캘린더</a>
          </>
        ) : (
          <>
            <a href="/login" onClick={closeMobileMenu}>로그인</a>
            <a className="mobile-nav-primary" href="/login" onClick={closeMobileMenu}>지금 시작하기</a>
          </>
        )}
      </nav>
    </header>
  );
}
