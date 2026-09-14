import { assetUrl, hideUnavailableAsset } from '../../../../shared/assets/assetUrl';
import { GoogleIcon } from '../../../../shared/ui/GoogleIcon';
import { buttonClass, eyebrowClass, primaryButtonClass, shellClass } from '../../../../shared/ui/styles';

const calendarImageUrl = assetUrl('edit/calendar-3d.webp');

export function CtaSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="py-16 max-md:py-11">
      <div className={`${shellClass} grid grid-cols-[160px_minmax(0,1fr)_auto] items-center gap-8 overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#eef6ff,#f8fbff)] px-12 py-10 max-lg:grid-cols-[130px_minmax(0,1fr)] max-md:grid-cols-1 max-md:justify-items-center max-md:px-6 max-md:py-8 max-md:text-center`}>
        <div className="grid place-items-center"><img className="h-32 w-auto object-contain max-md:h-28" src={calendarImageUrl} alt="" onError={hideUnavailableAsset} /></div>
        <div>
          <p className={eyebrowClass}>TOGETHER, A BETTER TIME</p>
          <h2 className="mt-3 mb-2 text-[30px] font-black tracking-[-0.05em] text-ink-900 max-md:text-[26px]">지금, 더 좋은 시간을 만들어보세요</h2>
          <p className="m-0 text-[#7183a0]">캘린더 하나로 시작하는 더 쉬운 약속.</p>
        </div>
        <div className="grid justify-items-center gap-2 max-lg:col-start-2 max-md:col-start-auto">
          <a className={`${buttonClass} ${primaryButtonClass}`} href={isAuthenticated ? '#my-calendars' : '/login'}>
            {isAuthenticated ? (
              <span>내 캘린더 보기</span>
            ) : (
              <>
                <GoogleIcon className="max-lg:hidden" />
                <span className="max-lg:hidden">Google로 시작하기</span>
                <span className="hidden max-lg:inline">무료로 시작하기 →</span>
              </>
            )}
          </a>
          <small className="text-[13px] text-[#788ba6]">별도의 가입 절차 없이 시작할 수 있어요.</small>
        </div>
      </div>
    </section>
  );
}
