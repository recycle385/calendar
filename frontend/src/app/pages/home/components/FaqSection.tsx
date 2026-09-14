import { ChevronDown } from 'lucide-react';
import { eyebrowClass, shellClass } from '../../../../shared/ui/styles';

const faqs = [
  ['회원가입 없이도 사용할 수 있나요?', '공유 링크를 받은 사용자는 게스트로 일정에 참여할 수 있어요.'],
  ['참여자는 꼭 회원이어야 하나요?', '아니요. 로그인 없이 게스트로 참여할 수 있어요.'],
  ['캘린더를 수정하거나 삭제할 수 있나요?', '캘린더를 만든 방장은 제목, 설명, 기간을 수정하거나 캘린더를 삭제할 수 있어요.'],
  ['Google 계정이 꼭 필요한가요?', '캘린더를 새로 만들려면 Google 로그인이 필요해요.'],
];

export function FaqSection() {
  return (
    <section className="py-20 max-md:py-14" id="faq">
      <div className={`${shellClass} grid grid-cols-[280px_minmax(0,1fr)] gap-16 max-md:grid-cols-1 max-md:gap-7`}>
        <div>
          <p className={eyebrowClass}>FAQ</p>
          <h2 className="mt-3 mb-0 text-[34px] font-black tracking-[-0.05em] text-ink-900 max-md:text-[28px]">자주 묻는 질문</h2>
          <a className="mt-5 inline-flex text-[13px] font-bold text-brand-500" href="#faq">전체 보기 ›</a>
        </div>
        <div className="border-t border-[#dfe8f3]">
          {faqs.map(([question, answer]) => (
            <details className="group border-b border-[#dfe8f3]" key={question}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-sm font-extrabold text-[#29486f] [&::-webkit-details-marker]:hidden">
                <span>{question}</span>
                <ChevronDown className="shrink-0 transition-transform group-open:rotate-180" size={18} />
              </summary>
              <p className="mt-0 mb-5 text-sm leading-7 text-[#7185a3]">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
