import { CalendarPlus, Link2, UsersRound, type LucideIcon } from 'lucide-react';

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
    <section className="section steps-section" id="guide">
      <div className="shell steps-band">
        <div className="section-lead steps-lead">
          <p className="eyebrow">HOW IT WORKS</p>
          <h2>이렇게 시작하세요</h2>
          <p>단 몇 단계만으로, 모두의 일정을 쉽게 모을 수 있습니다.</p>
        </div>
        <div className="steps">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <article className="step" key={title}>
              <span className="step-number">{index + 1}</span>
              <span className="step-icon">
                <Icon size={28} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              {index < steps.length - 1 && <span className="step-arrow">›</span>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
