import { assetUrl, hideUnavailableAsset } from '../../../../../shared/assets/assetUrl'
import { PLACEHOLDER_IMAGE_PATH } from '../../calendarHelpers'
import { eyebrowClass, panelClass } from '../../../../../shared/ui/styles'

export function CalendarListAside() {
  return (
    <>
      <section className={`${panelClass} relative grid min-h-[200px] content-end overflow-hidden p-5 max-[1180px]:min-h-[150px] max-[800px]:[&:not(:first-child)]:hidden`}>
        <img
          className="absolute inset-0 size-full bg-[#eaf4ff] object-contain opacity-35"
          src={assetUrl(PLACEHOLDER_IMAGE_PATH)}
          alt="모임 캘린더 안내 이미지"
          onError={hideUnavailableAsset}
        />
        <div className="relative">
          <p className={`${eyebrowClass} mb-[7px]`}>ONE LINK, TOGETHER</p>
          <strong className="text-xl leading-[1.35] text-[#15396c]">링크 하나로<br />일정을 시작하세요.</strong>
        </div>
      </section>
      <section className={`${panelClass} flex gap-3 overflow-hidden p-5 text-[#597491] max-[800px]:hidden`}>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-black text-white">01</span>
        <div>
          <strong className="text-[13px] text-[#294e80]">참여 링크를 공유해보세요.</strong>
          <p className="mt-[5px] mb-0 text-xs leading-[1.55]">참여자는 로그인 없이도 가능한 날짜를 표시할 수 있어요.</p>
        </div>
      </section>
    </>
  )
}
