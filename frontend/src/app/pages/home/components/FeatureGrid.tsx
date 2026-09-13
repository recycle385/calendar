import {
  CalendarDays,
  Clock3,
  Link2,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

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
    <section className="feature-grid-wrap" id="features">
      <div className="shell feature-showcase">
        <header className="feature-heading">
          <p className="feature-eyebrow">
            <span className="feature-copy-desktop">WHY MOIM</span>
            <span className="feature-copy-mobile">WHY CAL TOGETHER</span>
          </p>
          <h2>
            <span className="feature-copy-desktop">모임이 쉬워지는 6가지 이유</span>
            <span className="feature-copy-mobile">시간 조율이 쉬워지면,<br />더 많은 일이 가능해집니다.</span>
          </h2>
          <p className="feature-description">
            복잡한 일정 조율은 이제 그만,
            <br />moim이 해결해요.
          </p>
        </header>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <article className="feature-card" key={title}>
              <div className="feature-icon">
                <Icon size={27} strokeWidth={2.2} />
              </div>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
