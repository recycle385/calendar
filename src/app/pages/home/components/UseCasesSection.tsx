import { CalendarDays, Users } from 'lucide-react';
import { assetUrl } from '../../../../shared/assets/assetUrl';

const cards = [
  ['스터디', '9월 스터디 모임', '함께하는 학습이 더 즐거워요.', '8명 참여', '월 2회'],
  ['업무', '팀 프로젝트 회의', '공통적인 회의 일정을 찾아보세요.', '8명 참여', '수시'],
  ['여행', '부산 여행 일정', '함께 떠나는 특별한 여행을 계획해요.', '6명 참여', '10월 중'],
  ['동아리', '동아리 정기모임', '좋아하는 사람들과 좋은 시간을.', '8명 참여', '매월'],
];

const placeholderImageUrl = assetUrl('main/dotoffice_header_logo.webp');

export function UseCasesSection() {
  return (
    <section className="section usecases-section" id="examples">
      <div className="shell usecases-layout">
        <div className="section-lead side">
          <h2>이런 일정에 활용할 수 있어요</h2>
          <p>어디서든, 함께하는 일정이 더 쉬워집니다.</p>
        </div>
        <div className="usecase-cards">
          {cards.map(([tag, title, text, people, date]) => (
            <article className="usecase-card" key={title}>
              <div className="usecase-image">
                <img src={placeholderImageUrl} alt="" />
                <span>{tag}</span>
              </div>
              <div className="usecase-body">
                <h3>{title}</h3>
                <p>{text}</p>
                <div>
                  <span><Users size={14} />{people}</span>
                  <span><CalendarDays size={14} />{date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
