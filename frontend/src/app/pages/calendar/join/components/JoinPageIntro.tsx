import { CheckCircle2, Link2, Users } from 'lucide-react'

export function JoinPageIntro() {
  return (
    <section className="join-page-intro">
      <p className="eyebrow">JOIN CALENDAR</p>
      <h1>함께 만드는<br /><span>더 좋은 시간</span></h1>
      <p>공유받은 링크로 캘린더에 참여하고, 소중한 사람들과 가능한 날짜를 조율해보세요.</p>
      <ul>
        <li><Users size={19} /> 로그인 없이도 빠르게 참여할 수 있어요.</li>
        <li><CheckCircle2 size={19} /> 참여 후 바로 날짜 투표를 시작해요.</li>
        <li><Link2 size={19} /> 링크 하나로 언제든 다시 들어올 수 있어요.</li>
      </ul>
    </section>
  )
}
