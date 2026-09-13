import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from './Brand';
import { GoogleIcon } from './GoogleIcon';

interface HeaderProps {
  isAuthenticated?: boolean;
  displayName?: string | null;
  workspace?: boolean;
}

export function Header({ isAuthenticated = false, displayName, workspace = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Brand />

        <nav className="desktop-nav" aria-label="주 메뉴">
          {workspace ? (
            <>
              <Link to="/">홈</Link>
              <Link to="/calendars">내 캘린더</Link>
              <Link to="/calendars/new">캘린더 만들기</Link>
            </>
          ) : (
            <>
              <a href="#features">서비스 소개</a>
              <a href="#guide">이용 방법</a>
              <a href="#faq">자주 묻는 질문</a>
              <a className="desktop-extra-nav" href="#examples">활용 예시</a>
            </>
          )}
        </nav>

        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <Link className="login-link" to="/calendars">{displayName ?? '회원'}님</Link>
              <Link className="button button-primary button-small" to="/calendars">내 캘린더</Link>
            </>
          ) : (
            <>
              <Link className="login-link" to="/login">로그인</Link>
              <Link className="button button-primary button-small" to="/login">
                <GoogleIcon className="header-google" />
                <span className="header-label-wide">Google로 시작하기</span>
                <span className="header-label-tablet">시작하기</span>
              </Link>
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
        {workspace ? (
          <>
            <Link to="/" onClick={closeMobileMenu}>홈</Link>
            <Link to="/calendars" onClick={closeMobileMenu}>내 캘린더</Link>
            <Link to="/calendars/new" onClick={closeMobileMenu}>캘린더 만들기</Link>
          </>
        ) : (
          <>
            <a href="#features" onClick={closeMobileMenu}>서비스 소개</a>
            <a href="#guide" onClick={closeMobileMenu}>이용 방법</a>
            <a href="#faq" onClick={closeMobileMenu}>자주 묻는 질문</a>
          </>
        )}
        {isAuthenticated ? (
          <>
            <Link to="/calendars" onClick={closeMobileMenu}>{displayName ?? '회원'}님</Link>
            <Link className="mobile-nav-primary" to="/calendars" onClick={closeMobileMenu}>내 캘린더</Link>
          </>
        ) : (
          <>
            <Link to="/login" onClick={closeMobileMenu}>로그인</Link>
            <Link className="mobile-nav-primary" to="/login" onClick={closeMobileMenu}>지금 시작하기</Link>
          </>
        )}
      </nav>
    </header>
  );
}
