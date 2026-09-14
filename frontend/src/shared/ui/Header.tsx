import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Brand } from "./Brand";
import {
  buttonClass,
  primaryButtonClass,
  shellClass,
  loginButtonClass,
} from "./styles";

interface HeaderProps {
  isAuthenticated?: boolean;
  displayName?: string | null;
  workspace?: boolean;
  onLogout?: () => Promise<void>;
}

export function Header({
  isAuthenticated = false,
  displayName,
  workspace = false,
  onLogout,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  async function handleLogout() {
    if (!onLogout || loggingOut) return;
    setLoggingOut(true);
    setLogoutError(false);
    try {
      await onLogout();
      closeMobileMenu();
    } catch {
      setLogoutError(true);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 h-[72px] overflow-visible border-b border-[#e9eef6] bg-white/95 backdrop-blur-[14px] max-[1535px]:h-[66px] max-md:h-[68px] max-[420px]:h-16">
      <div
        className={`${shellClass} flex h-full items-center gap-10 max-[1535px]:max-w-[1120px] max-[1535px]:gap-6 max-md:justify-between max-md:gap-3`}
      >
        <Brand />

        <nav
          className="flex gap-[34px] text-sm text-[#6f7f98] max-[1535px]:ml-auto max-[1535px]:items-center max-[1535px]:justify-center max-[1535px]:gap-7 max-[1535px]:text-xs max-md:hidden [&>a]:px-1 [&>a]:py-2.5 [&>a:hover]:text-brand-500"
          aria-label="주 메뉴"
        >
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
              <a className="max-[1535px]:hidden" href="#examples">
                활용 예시
              </a>
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-6 text-sm max-[1535px]:ml-1.5 max-[1535px]:shrink-0 max-[1535px]:gap-4 max-[1535px]:text-xs max-md:hidden">
          {isAuthenticated ? (
            <>
              <Link className="font-bold hover:text-brand-500" to="/calendars">
                {displayName ?? "회원"}님
              </Link>
              <button
                className="border-0 bg-transparent p-0 font-bold text-[#587195] hover:text-brand-500 disabled:cursor-wait disabled:opacity-60"
                type="button"
                disabled={loggingOut}
                onClick={() => void handleLogout()}
              >
                {loggingOut ? "로그아웃 중…" : "로그아웃"}
              </button>
              <Link
                className={`${buttonClass} ${loginButtonClass} w-[100px] px-[18px] py-2.5 max-[1535px]:min-w-[74px] max-[1535px]:px-[15px]`}
                to="/calendars"
              >
                내 캘린더
              </Link>
              {logoutError && (
                <span className="text-xs font-bold text-[#d14343]" role="alert">
                  로그아웃 실패
                </span>
              )}
            </>
          ) : (
            <>
              <Link
                className={`${buttonClass} ${loginButtonClass}`}
                to="/login"
              >
                <span className="max-[1535px]:hidden">로그인</span>
                <span className="hidden max-[1535px]:inline">로그인</span>
              </Link>
            </>
          )}
        </div>

        <button
          className="hidden size-10 items-center justify-center rounded-xl border-0 bg-white text-[#52627c] shadow-[0_8px_22px_rgba(34,71,118,0.08)] max-md:inline-flex"
          type="button"
          aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav
        className={`absolute top-[60px] right-3.5 left-3.5 z-[70] hidden gap-0.5 rounded-2xl border border-[#e4ebf5] bg-white/98 p-2.5 shadow-[0_18px_42px_rgba(30,65,112,0.16)] transition duration-150 max-md:grid max-[420px]:top-[57px] max-[420px]:right-2.5 max-[420px]:left-2.5 [&>a]:flex [&>a]:min-h-11 [&>a]:items-center [&>a]:rounded-[10px] [&>a]:px-[13px] [&>a]:text-sm [&>a]:font-bold [&>a]:text-[#40516c] [&>a:active]:bg-brand-50 [&>button]:flex [&>button]:min-h-11 [&>button]:w-full [&>button]:items-center [&>button]:rounded-[10px] [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-[13px] [&>button]:text-sm [&>button]:font-bold${mobileMenuOpen ? " visible translate-y-0 opacity-100" : " invisible -translate-y-2 opacity-0"}`}
        aria-label="모바일 주 메뉴"
      >
        {workspace ? (
          <>
            <Link to="/" onClick={closeMobileMenu}>
              홈
            </Link>
            <Link to="/calendars" onClick={closeMobileMenu}>
              내 캘린더
            </Link>
            <Link to="/calendars/new" onClick={closeMobileMenu}>
              캘린더 만들기
            </Link>
          </>
        ) : (
          <>
            <a href="#features" onClick={closeMobileMenu}>
              서비스 소개
            </a>
            <a href="#guide" onClick={closeMobileMenu}>
              이용 방법
            </a>
            <a href="#faq" onClick={closeMobileMenu}>
              자주 묻는 질문
            </a>
          </>
        )}
        {isAuthenticated ? (
          <>
            <Link to="/calendars" onClick={closeMobileMenu}>
              {displayName ?? "회원"}님
            </Link>
            <Link
              className="mt-1 !justify-center !bg-brand-500 !text-white"
              to="/calendars"
              onClick={closeMobileMenu}
            >
              내 캘린더
            </Link>
            <button
              className="!text-[#d14343] disabled:cursor-wait disabled:opacity-60"
              type="button"
              disabled={loggingOut}
              onClick={() => void handleLogout()}
            >
              {loggingOut ? "로그아웃 중…" : "로그아웃"}
            </button>
            {logoutError && (
              <p
                className="mx-[13px] mt-0.5 mb-0 text-xs leading-[1.45] text-[#d14343]"
                role="alert"
              >
                로그아웃하지 못했어요. 다시 시도해주세요.
              </p>
            )}
          </>
        ) : (
          <>
            <Link to="/login" onClick={closeMobileMenu}>
              로그인
            </Link>
            <Link
              className="mt-1 !justify-center !bg-brand-500 !text-white"
              to="/login"
              onClick={closeMobileMenu}
            >
              지금 시작하기
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
