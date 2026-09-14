import { CalendarPlus, Link2, UsersRound, type LucideIcon } from 'lucide-react';
import { eyebrowClass, shellClass } from '../../../../shared/ui/styles';

type Step = {
  icon: LucideIcon;
  title: string;
  text: string;
};

const steps: Step[] = [
  {
    icon: CalendarPlus,
    title: '캘린더 만들기',
    text: '모임의 제목과 기간을 설정하고 공유 링크를 생성하세요.',
  },
  {
    icon: Link2,
    title: '링크 공유하기',
    text: '친구, 동료, 팀원에게 링크만 공유하면 끝!',
  },
  {
    icon: UsersRound,
    title: '함께 투표하기',
    text: '모두가 가능한 시간을 선택하고 최적의 일정을 찾아보세요.',
  },
];

export function StepsSection() {
  return (
    <section className="bg-[#f8fbff] py-20 max-md:py-14" id="guide">
      <div className={`${shellClass} grid gap-11`}>
        <div className="text-center">
          <p className={eyebrowClass}>HOW IT WORKS</p>
          <h2 className="mt-3 mb-2 text-[34px] font-black tracking-[-0.05em] text-ink-900 max-md:text-[28px]">이렇게 시작하세요</h2>
          <p className="m-0 text-[#7183a0]">단 몇 단계만으로, 모두의 일정을 쉽게 모을 수 있습니다.</p>
        </div>
        <div className="grid grid-cols-3 gap-10 max-md:grid-cols-1 max-md:gap-4">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <article className="relative grid justify-items-center gap-3 rounded-2xl bg-white px-6 py-8 text-center shadow-[0_12px_30px_rgba(65,104,153,0.07)] max-md:grid-cols-[auto_minmax(0,1fr)] max-md:justify-items-start max-md:text-left" key={title}>
              <span className="absolute top-4 left-4 grid size-6 place-items-center rounded-full bg-brand-100 text-xs font-black text-brand-500">{index + 1}</span>
              <span className="grid size-16 place-items-center rounded-full bg-brand-100 text-brand-500 max-md:row-span-2">
                <Icon size={28} />
              </span>
              <div>
                <h3 className="m-0 text-lg font-black text-[#284d7d]">{title}</h3>
                <p className="mt-2 mb-0 text-sm leading-6 text-[#7185a3]">{text}</p>
              </div>
              {index < steps.length - 1 && <span className="absolute top-1/2 -right-7 -translate-y-1/2 text-3xl text-[#b8cbe3] max-md:hidden">›</span>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
