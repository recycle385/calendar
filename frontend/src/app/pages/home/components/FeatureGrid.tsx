import {
  CalendarDays,
  Clock3,
  Link2,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { shellClass } from '../../../../shared/ui/styles';

type Feature = {
  icon: LucideIcon;
  title: string;
  text: string;
};

const features: Feature[] = [
  {
    icon: CalendarDays,
    title: '간편한 일정 조율',
    text: '복잡한 일정 조율을 한 번에 해결하세요.',
  },
  {
    icon: UsersRound,
    title: '실시간 참여',
    text: '링크만 공유하면 누구나 바로 참여할 수 있어요.',
  },
  {
    icon: ShieldCheck,
    title: '안전한 참여',
    text: '비밀번호로 참여를 보호할 수 있어요.',
  },
  {
    icon: Clock3,
    title: '자동 마감',
    text: '설정한 시간에 따라 자동으로 마감돼요.',
  },
  {
    icon: Link2,
    title: '링크 공유 참여',
    text: '공유 링크 하나로 일정에 바로 초대하세요.',
  },
  {
    icon: UserRoundCheck,
    title: '회원/게스트 참여',
    text: '상황에 맞게 로그인 또는 게스트로 참여하세요.',
  },
];

export function FeatureGrid() {
  return (
    <section className="py-16 max-lg:py-12 max-md:py-[38px]" id="features">
      <div className={`${shellClass} grid grid-cols-[330px_minmax(0,1fr)] items-center gap-16 max-lg:grid-cols-1 max-lg:gap-[34px] max-md:gap-[26px]`}>
        <header className="max-md:text-left">
          <p className="text-xs font-black tracking-[0.22em] text-[#5d77a0]">
            <span className="max-md:hidden">WHY MOIM</span>
            <span className="hidden max-md:inline">WHY CAL TOGETHER</span>
          </p>
          <h2 className="mt-3 mb-0 text-[32px] leading-[1.3] font-black tracking-[-0.055em] text-ink-900 max-md:text-[clamp(27px,7.2vw,34px)]">
            <span className="max-md:hidden">모임이 쉬워지는 6가지 이유</span>
            <span className="hidden max-md:inline">시간 조율이 쉬워지면,<br />더 많은 일이 가능해집니다.</span>
          </h2>
          <p className="mt-4 mb-0 leading-7 text-[#71839d] max-md:hidden">
            복잡한 일정 조율은 이제 그만,
            <br />moim이 해결해요.
          </p>
        </header>
        <div className="grid grid-cols-3 max-md:grid-cols-2 max-md:gap-3 max-[480px]:gap-2.5">
          {features.map(({ icon: Icon, title, text }, index) => (
            <article className={`flex min-h-28 items-start gap-4 px-[26px] pb-[27px] text-left max-md:min-h-[190px] max-md:flex-col max-md:items-center max-md:justify-start max-md:gap-[15px] max-md:rounded-[18px] max-md:border max-md:border-[#e4ebf4] max-md:bg-white max-md:px-3.5 max-md:py-[18px] max-md:text-center max-[480px]:min-h-[184px] max-[480px]:rounded-[17px] max-[480px]:px-2 ${index % 3 === 0 ? 'pl-0 max-md:pl-3.5 max-[480px]:pl-2' : 'border-l border-[#e4ebf4] max-md:border-l-[#e4ebf4]'} ${index < 3 ? 'border-b border-[#e4ebf4]' : 'pt-[27px] pb-0'} ${index >= 4 ? 'max-md:hidden' : ''}`} key={title}>
              <div className="grid size-[58px] shrink-0 place-items-center rounded-full bg-[#edf5ff] text-brand-500 max-md:size-[66px]">
                <Icon size={27} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="mt-1 mb-[7px] text-[15px] leading-[1.35] font-black text-ink-900 max-md:m-0 max-md:mb-[7px] max-md:text-lg max-[480px]:text-[17px]">{title}</h3>
                <p className="m-0 text-sm leading-[1.65] text-[#71839d] [word-break:keep-all] max-[480px]:text-[13px]">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
