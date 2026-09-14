import { CheckCircle2, Link2, Users } from 'lucide-react'
import { eyebrowClass } from '../../../../../shared/ui/styles'

export function JoinPageIntro() {
  return (
    <section className="grid min-h-[340px] content-start gap-[15px] px-3.5 py-[30px] max-[980px]:min-h-0 max-[980px]:px-1 max-[980px]:pt-[18px] max-[980px]:pb-6">
      <p className={`${eyebrowClass} m-0`}>JOIN CALENDAR</p>
      <h1 className="m-0 text-[clamp(33px,4vw,51px)] leading-[1.17] font-black tracking-[-0.065em] text-ink-900">함께 만드는<br /><span className="text-brand-500">더 좋은 시간</span></h1>
      <p className="m-0 leading-[1.7] text-[#607794]">공유받은 링크로 캘린더에 참여하고, 소중한 사람들과 가능한 날짜를 조율해보세요.</p>
      <ul className="mt-2 grid list-none gap-2.5 p-0 text-[13px] text-[#577395] [&>li]:flex [&>li]:items-center [&>li]:gap-[9px] [&_svg]:text-brand-500">
        <li><Users size={19} /> 로그인 없이도 빠르게 참여할 수 있어요.</li>
        <li><CheckCircle2 size={19} /> 참여 후 바로 날짜 투표를 시작해요.</li>
        <li><Link2 size={19} /> 링크 하나로 언제든 다시 들어올 수 있어요.</li>
      </ul>
    </section>
  )
}
