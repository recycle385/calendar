import type { ReactNode } from "react";
import { CalendarDays, ListChecks, Plus } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { Footer } from "../../../shared/ui/Footer";
import { Header } from "../../../shared/ui/Header";
import { assetUrl, hideUnavailableAsset } from "../../../shared/assets/assetUrl";
import { buttonClass, eyebrowClass, primaryButtonClass } from "../../../shared/ui/styles";
import { useAuth } from "../../providers/AuthProvider";

interface WorkspaceLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  sideContent?: ReactNode;
  hideRail?: boolean;
}

export function WorkspaceLayout({
  children,
  title,
  description,
  action,
  sideContent,
  hideRail = false,
}: WorkspaceLayoutProps) {
  const { logout, status, user } = useAuth();

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f7fbff_0%,#fff_48%,#f4f9ff_100%)]">
      <Header
        isAuthenticated={status === "authenticated"}
        displayName={user?.nickname}
        onLogout={logout}
      />
      <main className={`mx-auto grid min-h-[calc(100vh-72px)] w-[min(1480px,calc(100%-48px))] gap-[26px] py-[30px] pb-12 max-[1180px]:grid-cols-[185px_minmax(0,1fr)] max-[800px]:block max-[800px]:w-[min(calc(100%-28px),680px)] max-[800px]:pt-[18px] max-[520px]:w-[calc(100%-24px)] ${hideRail ? "grid-cols-[minmax(0,1fr)_270px] max-[1180px]:grid-cols-1" : "grid-cols-[210px_minmax(0,1fr)_270px]"}`}>
        {!hideRail && (
          <aside className="flex min-h-[510px] flex-col gap-[18px] py-[18px] max-[800px]:min-h-0 max-[800px]:pb-3.5" aria-label="캘린더 메뉴">
            <p className="mx-3.5 text-xs font-black tracking-[0.18em] text-[#8a9cb8] max-[800px]:hidden">CALENDAR SPACE</p>
            <nav className="grid gap-[5px] max-[800px]:grid-cols-3 max-[800px]:gap-1.5">
              <NavLink className={({ isActive }) => `flex items-center gap-[11px] rounded-[10px] px-3.5 py-3 text-sm font-bold text-[#587094] hover:bg-brand-100 hover:text-brand-500 max-[800px]:min-h-12 max-[800px]:min-w-0 max-[800px]:justify-center max-[800px]:gap-1.5 max-[800px]:px-1.5 max-[800px]:py-2 max-[800px]:text-center max-[800px]:text-xs ${isActive ? 'bg-brand-100 text-brand-500' : ''}`} to="/calendars" end>
                <CalendarDays size={18} /> 내 캘린더
              </NavLink>
              <NavLink className={({ isActive }) => `flex items-center gap-[11px] rounded-[10px] px-3.5 py-3 text-sm font-bold text-[#587094] hover:bg-brand-100 hover:text-brand-500 max-[800px]:min-h-12 max-[800px]:min-w-0 max-[800px]:justify-center max-[800px]:gap-1.5 max-[800px]:px-1.5 max-[800px]:py-2 max-[800px]:text-center max-[800px]:text-xs ${isActive ? 'bg-brand-100 text-brand-500' : ''}`} to="/calendars/new">
                <Plus size={18} /> 새 캘린더
              </NavLink>
              <a className="flex items-center gap-[11px] rounded-[10px] px-3.5 py-3 text-sm font-bold text-[#587094] hover:bg-brand-100 hover:text-brand-500 max-[800px]:min-h-12 max-[800px]:min-w-0 max-[800px]:justify-center max-[800px]:gap-1.5 max-[800px]:px-1.5 max-[800px]:py-2 max-[800px]:text-center max-[800px]:text-xs" href="/#guide">
                <ListChecks size={18} /> 이용 방법
              </a>
            </nav>
            <div className="sticky bottom-6 z-[1] mt-auto min-h-[150px] overflow-hidden rounded-[14px] bg-[linear-gradient(145deg,#f2f7ff_0%,#edf4ff_100%)] px-4 py-6 max-[800px]:hidden">
              <div className="relative z-[2] grid gap-3.5">
                <strong className="text-[15px] leading-[1.45] tracking-[-0.03em] text-[#1848c8]">함께 만드는<br />더 좋은 시간</strong>
                <span className="text-xs leading-[1.65] text-[#7285a5]">작은 약속이 모여<br />더 큰 의미가 됩니다.</span>
              </div>
              <span className="absolute -right-[30px] -bottom-[17px] size-[124px] rounded-full bg-[rgba(215,229,255,0.62)]" aria-hidden="true" />
              <img
                className="pointer-events-none absolute right-[-5px] bottom-[-3px] z-[2] h-auto w-[92px] object-contain"
                src={assetUrl("edit/calendar-3d.webp")}
                alt=""
                aria-hidden="true"
                onError={hideUnavailableAsset}
              />
            </div>
          </aside>
        )}

        <section className="min-w-0">
          {title && (
            <header className="my-[8px] mb-[22px] flex items-end justify-between gap-5 max-[800px]:flex-col max-[800px]:items-start">
              <div>
                <p className={`${eyebrowClass} mb-1.5`}>MOIM CALENDAR</p>
                <h1 className="m-0 text-[clamp(29px,3vw,38px)] font-black tracking-[-0.055em] text-ink-900">{title}</h1>
                {description && <p className="mt-2 mb-0 text-[#7183a0]">{description}</p>}
              </div>
              {action}
            </header>
          )}
          {children}
        </section>

        {sideContent && (
          <aside className={`grid min-w-0 content-start gap-3.5 pt-[38px] max-[1180px]:grid-cols-[repeat(auto-fit,minmax(210px,1fr))] max-[1180px]:pt-0 max-[800px]:mt-3.5 max-[800px]:grid-cols-1 max-[800px]:pb-0 ${hideRail ? 'max-[1180px]:col-start-1' : 'max-[1180px]:col-start-2'}`}>{sideContent}</aside>
        )}
      </main>
      <Footer />
    </div>
  );
}

export function LoginRequired() {
  return (
    <section className="grid min-h-[250px] place-content-center justify-items-center gap-3 p-9 text-center text-[#69809f]">
      <p className={eyebrowClass}>LOGIN REQUIRED</p>
      <h1 className="m-0 text-[22px] font-black text-[#19345d]">내 캘린더를 보려면 로그인이 필요해요.</h1>
      <p className="m-0 max-w-[430px] leading-[1.65]">Google 계정으로 로그인하면 만든 캘린더를 한곳에서 관리할 수 있어요.</p>
      <Link className={`${buttonClass} ${primaryButtonClass}`} to="/login">
        로그인하기
      </Link>
    </section>
  );
}
