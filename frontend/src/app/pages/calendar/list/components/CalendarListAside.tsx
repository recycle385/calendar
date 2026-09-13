import { assetUrl, hideUnavailableAsset } from '../../../../../shared/assets/assetUrl'
import { PLACEHOLDER_IMAGE_PATH } from '../../calendarHelpers'

export function CalendarListAside() {
  return (
    <>
      <section className="workspace-aside-card workspace-aside-image">
        <img
          src={assetUrl(PLACEHOLDER_IMAGE_PATH)}
          alt="모임 캘린더 안내 이미지"
          onError={hideUnavailableAsset}
        />
        <div>
          <p className="eyebrow">ONE LINK, TOGETHER</p>
          <strong>링크 하나로<br />일정을 시작하세요.</strong>
        </div>
      </section>
      <section className="workspace-aside-card aside-tip-card">
        <span className="aside-number">01</span>
        <div>
          <strong>참여 링크를 공유해보세요.</strong>
          <p>참여자는 로그인 없이도 가능한 날짜를 표시할 수 있어요.</p>
        </div>
      </section>
    </>
  )
}
