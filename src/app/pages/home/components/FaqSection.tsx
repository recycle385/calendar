import { ChevronDown } from 'lucide-react';

const faqs = [
  ['회원가입 없이도 사용할 수 있나요?', '공유 링크를 받은 사용자는 게스트로 일정에 참여할 수 있어요.'],
  ['참여자는 꼭 회원이어야 하나요?', '아니요. 로그인 없이 게스트로 참여할 수 있어요.'],
  ['캘린더를 수정하거나 삭제할 수 있나요?', '캘린더를 만든 방장은 제목, 설명, 기간을 수정하거나 캘린더를 삭제할 수 있어요.'],
  ['Google 계정이 꼭 필요한가요?', '캘린더를 새로 만들려면 Google 로그인이 필요해요.'],
];

export function FaqSection() {
  return (
    <section className="section faq-section" id="faq">
      <div className="shell faq-layout">
        <div className="section-lead side faq-lead">
          <p className="eyebrow">FAQ</p>
          <h2>자주 묻는 질문</h2>
          <a className="faq-all-link" href="#faq">전체 보기 ›</a>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>
                <span>{question}</span>
                <ChevronDown size={18} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
