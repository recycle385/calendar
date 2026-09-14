import { CalendarDays, Users } from "lucide-react";
import {
  assetUrl,
  hideUnavailableAsset,
} from "../../../../shared/assets/assetUrl";
import { shellClass } from "../../../../shared/ui/styles";

const cards = [
  [
    "스터디",
    "9월 스터디 모임",
    "함께하는 학습이 더 즐거워요.",
    "8명 참여",
    "월 2회",
    "main/group/study.webp",
  ],
  [
    "업무",
    "팀 프로젝트 회의",
    "공통적인 회의 일정을 찾아보세요.",
    "8명 참여",
    "수시",
    "main/group/team_project.webp",
  ],
  [
    "여행",
    "부산 여행 일정",
    "함께 떠나는 특별한 여행을 계획해요.",
    "6명 참여",
    "10월 중",
    "main/group/travel.webp",
  ],
  [
    "동아리",
    "동아리 정기모임",
    "좋아하는 사람들과 좋은 시간을.",
    "8명 참여",
    "매월",
    "main/group/club.webp",
  ],
];

export function UseCasesSection() {
  return (
    <section className="py-20 max-[1535px]:hidden" id="examples">
      <div className={`${shellClass} grid grid-cols-[260px_minmax(0,1fr)] gap-12`}>
        <div>
          <h2 className="m-0 text-[34px] leading-[1.3] font-black tracking-[-0.05em] text-ink-900">
            이런 일정에 <br></br>활용할 수 있어요
          </h2>
          <p className="mt-4 mb-0 leading-7 text-[#7183a0]">
            어디서든, 함께하는 일정이<br></br> 더 쉬워집니다.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {cards.map(([tag, title, text, people, date, imageUrl]) => (
            <article className="overflow-hidden rounded-2xl border border-[#e1eaf5] bg-white shadow-[0_12px_28px_rgba(65,104,153,0.07)]" key={title}>
              <div className="relative h-[150px] overflow-hidden bg-[#edf5ff]">
                <img
                  className="size-full object-cover"
                  src={assetUrl(imageUrl)}
                  alt=""
                  onError={hideUnavailableAsset}
                />
                <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-black text-brand-500">{tag}</span>
              </div>
              <div className="p-4">
                <h3 className="m-0 text-base font-black text-[#29486f]">{title}</h3>
                <p className="mt-2 mb-4 text-[13px] leading-6 text-[#7185a3]">{text}</p>
                <div className="flex gap-3 text-xs font-bold text-[#7890ad]">
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {people}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays size={14} />
                    {date}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
