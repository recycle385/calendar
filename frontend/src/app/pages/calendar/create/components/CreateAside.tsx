import { CalendarDays, Check, Link2, Users } from 'lucide-react'

import { assetUrl, hideUnavailableAsset } from '../../../../../shared/assets/assetUrl'
import { eyebrowClass, panelClass } from '../../../../../shared/ui/styles'
import { PLACEHOLDER_IMAGE_PATH } from '../../calendarHelpers'

export function CreateAside() {
  return (
    <>
      <section className={`${panelClass} grid gap-[9px] overflow-hidden p-5 text-[#1c4278] max-[800px]:[&:not(:first-child)]:hidden`}>
        <img
          className="h-32 w-full rounded-[11px] bg-[#eaf4ff] object-contain"
          src={assetUrl(PLACEHOLDER_IMAGE_PATH)}
          alt="캘린더 대표 이미지 미리보기"
          onError={hideUnavailableAsset}
        />
        <p className={`${eyebrowClass} mt-[5px] mb-0`}>CALENDAR PREVIEW</p>
        <strong className="text-lg leading-[1.45]">모임이 만들어지면<br />바로 링크를 공유할 수 있어요.</strong>
      </section>
      <section className={`${panelClass} overflow-hidden p-5 max-[800px]:hidden`}>
        <h2 className="mt-0 mb-4 text-base font-black text-[#183762]">생성 후 이렇게 진행돼요</h2>
        <ol className="m-0 grid list-none gap-3.5 p-0 [&_li]:flex [&_li]:items-start [&_li]:gap-2.5 [&_li>span]:grid [&_li>span]:size-[30px] [&_li>span]:shrink-0 [&_li>span]:place-items-center [&_li>span]:rounded-full [&_li>span]:bg-brand-100 [&_li>span]:text-brand-500 [&_strong]:block [&_strong]:text-[13px] [&_strong]:text-[#284d7d] [&_p]:mt-[3px] [&_p]:mb-0 [&_p]:text-xs [&_p]:leading-[1.45] [&_p]:text-[#8293aa]">
          <li><span><Link2 size={16} /></span><div><strong>링크 생성</strong><p>고유한 참여 링크가 발급돼요.</p></div></li>
          <li><span><Users size={16} /></span><div><strong>참여자 초대</strong><p>친구와 동료에게 링크를 공유해요.</p></div></li>
          <li><span><CalendarDays size={16} /></span><div><strong>날짜 투표</strong><p>모두 가능한 날을 한눈에 찾아요.</p></div></li>
        </ol>
        <p className="mt-[17px] mb-0 flex items-center gap-[5px] border-t border-[#e7edf5] pt-[13px] text-xs !text-[#45815e]"><Check size={15} /> 생성한 뒤에도 내용을 수정할 수 있어요.</p>
      </section>
    </>
  )
}
