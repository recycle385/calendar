import { CalendarDays, Check, Link2, Users } from 'lucide-react'

import { assetUrl, hideUnavailableAsset } from '../../../../../shared/assets/assetUrl'
import { PLACEHOLDER_IMAGE_PATH } from '../../calendarHelpers'

export function CreateAside() {
  return (
    <>
      <section className="workspace-aside-card create-preview-card">
        <img
          src={assetUrl(PLACEHOLDER_IMAGE_PATH)}
          alt="캘린더 대표 이미지 미리보기"
          onError={hideUnavailableAsset}
        />
        <p className="eyebrow">CALENDAR PREVIEW</p>
        <strong>모임이 만들어지면<br />바로 링크를 공유할 수 있어요.</strong>
      </section>
      <section className="workspace-aside-card workflow-card">
        <h2>생성 후 이렇게 진행돼요</h2>
        <ol>
          <li><span><Link2 size={16} /></span><div><strong>링크 생성</strong><p>고유한 참여 링크가 발급돼요.</p></div></li>
          <li><span><Users size={16} /></span><div><strong>참여자 초대</strong><p>친구와 동료에게 링크를 공유해요.</p></div></li>
          <li><span><CalendarDays size={16} /></span><div><strong>날짜 투표</strong><p>모두 가능한 날을 한눈에 찾아요.</p></div></li>
        </ol>
        <p className="workflow-safety"><Check size={15} /> 생성한 뒤에도 내용을 수정할 수 있어요.</p>
      </section>
    </>
  )
}
