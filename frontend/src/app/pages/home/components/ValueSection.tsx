import { eyebrowClass, shellClass } from '../../../../shared/ui/styles';

const names = ['김지수', '이현우', '박서연', '최민준', '정다은'];
const states = ['가능', '가능', '가능', '보류', '불가능'];

export function ValueSection() {
  return (
    <section className="py-20 max-md:py-14">
      <div className={`${shellClass} mt-4 grid min-h-[430px] grid-cols-[0.82fr_1.18fr] overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#f5f9ff,#fff)] max-lg:min-h-[390px] max-md:grid-cols-1 max-md:overflow-visible max-md:bg-transparent`}>
        <div className="px-[42px] py-10 max-lg:px-9 max-md:px-0 max-md:py-0">
          <p className={eyebrowClass}>
            <span className="max-md:hidden">한눈에 확인하는 투표 현황</span>
            <span className="hidden max-md:inline">REAL-TIME VOTING</span>
          </p>
          <h2 className="mt-3 mb-3 text-[33px] leading-[1.3] font-black tracking-[-0.05em] text-ink-900 max-lg:text-[32px] max-md:mb-2.5 max-md:text-[28px] max-[420px]:text-[27px]">모두의 가능한 시간이<br />바로 보입니다.</h2>
          <p className="m-0 text-sm leading-7 text-[#7183a0] max-md:text-[13px]">
            달력에서 가능한 시간을 선택하면
            <br />실시간으로 투표 현황이 반영됩니다.
          </p>
          <ul className="mt-6 list-none p-0 text-sm font-bold text-[#526e92] max-lg:hidden">
            <li className="my-3 before:mr-2 before:text-brand-500 before:content-['✓']">참여자별 응답 현황을 한눈에</li>
            <li className="my-3 before:mr-2 before:text-brand-500 before:content-['✓']">날짜별 투표 결과를 실시간으로</li>
            <li className="my-3 before:mr-2 before:text-brand-500 before:content-['✓']">모두가 가능한 최적의 시간 제안</li>
          </ul>
        </div>

        <div className="relative max-md:mt-[18px] max-md:min-h-[292px] max-md:overflow-hidden max-md:rounded-[18px] max-md:bg-[radial-gradient(circle_at_90%_75%,rgba(215,241,226,0.9),transparent_34%),linear-gradient(180deg,#f7fbff_0,#eef6ff_100%)] max-[420px]:min-h-[280px]" aria-label="실시간 투표 현황 예시">
          <div className="absolute top-[25px] left-[11%] h-[325px] w-[57%] overflow-hidden rounded-[14px] bg-white pb-3 shadow-[0_20px_52px_rgba(47,90,142,0.12)] max-md:top-5 max-md:left-[7px] max-md:z-[1] max-md:h-[190px] max-md:w-[67%] max-md:rounded-[15px]">
            <div className="flex h-[42px] items-center gap-[7px] bg-[#f6f9fd] px-[15px] max-md:hidden [&>span]:size-[9px] [&>span]:rounded-full [&>span]:bg-[#ff8b7a] [&>span:nth-child(2)]:bg-[#ffd467] [&>span:nth-child(3)]:bg-[#65d6a0]"><span></span><span></span><span></span><i className="ml-3 h-[13px] flex-1 rounded-[7px] bg-[#eaf0f7]"></i></div>
            <div className="mx-[22px] mt-4 mb-[18px] flex items-center justify-between max-md:mx-[13px] max-md:mt-3.5 max-md:mb-2 max-md:text-[10px]"><b>2026년 9월</b><span>›</span></div>
            <div className="mx-[22px] mb-[7px] grid grid-cols-7 gap-[5px] text-center text-[11px] text-[#8998ad] max-md:mx-[13px] max-md:mb-1 max-md:gap-[3px] max-md:text-[7px]">
              <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
            </div>
            <div className="mx-[22px] grid grid-cols-7 gap-[5px] text-center max-md:mx-[13px] max-md:gap-[3px]">
              {Array.from({ length: 35 }, (_, i) => (
                <span
                  key={i}
                  className={`grid h-[31px] place-items-center rounded-[7px] text-xs text-[#52627c] max-md:h-5 max-md:text-[7px] ${i === 17 ? 'bg-brand-500 text-white shadow-[0_8px_18px_rgba(22,119,255,0.28)]' : [9, 15, 23, 25].includes(i) ? 'bg-[#e7f7ef] text-[#15935a]' : ''}`}
                >
                  {(i + 30) % 30 + 1}
                </span>
              ))}
            </div>
          </div>

          <div className="absolute top-[70px] right-[5%] w-[190px] rounded-[13px] bg-white p-4 shadow-[0_18px_40px_rgba(47,90,142,0.12)] max-md:top-[18px] max-md:right-[5px] max-md:z-[3] max-md:w-[37%] max-md:min-w-[118px] max-md:px-[9px] max-md:py-2.5 max-[420px]:min-w-[110px]">
            <b className="block max-md:hidden">9월 17일 (목)</b>
            <b className="mb-[7px] hidden text-[10px] max-md:block">참여자 5명</b>
            <small className="my-[5px] mb-2.5 block text-[#15935a] max-md:hidden">4명 가능</small>
            {names.map((name, i) => (
              <div className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-2 text-[11px] max-md:mt-[5px] max-md:grid-cols-[18px_minmax(0,1fr)_7px] max-md:gap-[5px] max-md:text-[8px]" key={name}>
                <span className={`inline-grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-extrabold text-white max-md:size-[18px] max-md:text-[7px] ${['bg-[#3e8cf7]','bg-[#57b19c]','bg-[#ff926f]','bg-[#7b72e8]','bg-[#d5799b]'][i]}`}>{name[0]}</span>
                <span className="min-w-0 truncate">{name}</span>
                <em className={`rounded-[10px] px-[7px] py-[3px] not-italic max-md:hidden ${states[i] === '불가능' ? 'bg-[#fee8e8] text-[#dd4c4c]' : states[i] === '보류' ? 'bg-[#fff2dc] text-[#cc7f16]' : 'bg-[#e6f8ee] text-[#15935a]'}`}>{states[i]}</em>
                <i className={`hidden size-1.5 rounded-full max-md:block ${states[i] === '불가능' ? 'bg-[#ef6c67]' : states[i] === '보류' ? 'bg-[#ffad45]' : 'bg-[#18b873]'}`} />
              </div>
            ))}
            <button className="mt-3 w-full rounded-lg border-0 bg-brand-500 p-2.5 text-xs font-extrabold text-white max-md:hidden">이 날짜로 선택하기</button>
          </div>

          <div className="absolute right-1 bottom-3 z-[4] hidden w-[145px] rounded-2xl bg-[#dff8eb] px-3 py-2.5 text-[9px] shadow-[0_16px_34px_rgba(55,101,158,0.12)] max-md:block max-[420px]:w-[138px]">
            <b>9월 17일 (목)</b>
            <span className="mt-1.5 block text-[#15935a]"><i className="mr-[5px] inline-block size-[7px] rounded-full bg-[#18b873]" />4명 가능</span>
            <div className="mt-2 flex [&>em]:-mr-[5px] [&>em]:grid [&>em]:size-[22px] [&>em]:place-items-center [&>em]:rounded-full [&>em]:border-2 [&>em]:border-white [&>em]:bg-[#e8f1ff] [&>em]:text-[8px] [&>em]:not-italic [&>em]:text-[#235a9f]"><em>김</em><em>이</em><em>박</em><em>+1</em></div>
          </div>
        </div>
      </div>
    </section>
  );
}
