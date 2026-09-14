import { Link2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { parseCalendarJoinPath } from '../../../../domains/calendar';
import { assetUrl, hideUnavailableAsset } from '../../../../shared/assets/assetUrl';
import { buttonClass, eyebrowClass, primaryButtonClass, shellClass } from '../../../../shared/ui/styles';

const days = [
  ['30', '31', '1', '2', '3', '4', '5'],
  ['6', '7', '8', '9', '10', '11', '12'],
  ['13', '14', '15', '16', '17', '18', '19'],
  ['20', '21', '22', '23', '24', '25', '26'],
  ['27', '28', '29', '30', '1', '2', '3'],
];

const mobileHeroImageUrl = assetUrl('edit/calendar-3d.webp');

export function HeroSection() {
  const navigate = useNavigate();
  const [shareLink, setShareLink] = useState('');
  const [shareLinkError, setShareLinkError] = useState<string | null>(null);

  function joinCalendar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const joinPath = parseCalendarJoinPath(shareLink, window.location.origin);
    if (!joinPath) {
      setShareLinkError('moim에서 받은 캘린더 공유 링크를 확인해주세요.');
      return;
    }
    navigate(joinPath);
  }

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_75%_35%,#edf7ff_0,#fff_47%)] py-12 pb-10 before:absolute before:top-[95px] before:-left-[220px] before:size-[340px] before:rounded-full before:bg-[#eaf5ff] after:absolute after:-top-20 after:-right-[300px] after:size-[460px] after:rounded-full after:bg-[#eaf5ff] max-[1535px]:min-h-[410px] max-[1535px]:py-[50px] max-[1535px]:pb-[46px] max-md:pb-[22px]" id="top">
      <div className={`${shellClass} relative z-[1] grid grid-cols-[0.85fr_1.35fr] items-center gap-[50px] max-[1535px]:max-w-[1120px] max-md:grid-cols-1 max-md:gap-5`}>
        <div className="relative hidden h-32 w-full max-md:block max-[480px]:h-[118px] max-[420px]:h-[108px]" aria-hidden="true">
          <div className="absolute top-[34px] left-0.5 -rotate-[9deg] text-sm leading-[1.35] font-extrabold text-[#2876f5] max-[480px]:top-[27px] max-[480px]:text-[13px] max-[420px]:text-xs">
            좋은 사람들이
            <br />좋은 시간을 만들어요!
          </div>
          <img className="absolute top-0 -right-1 h-[120px] w-44 object-contain drop-shadow-[0_10px_18px_rgba(36,85,145,0.12)] max-[480px]:h-28 max-[480px]:w-[164px] max-[420px]:h-[104px] max-[420px]:w-[148px]" src={mobileHeroImageUrl} alt="" onError={hideUnavailableAsset} />
        </div>

        <div className="pl-12 max-md:px-1 max-md:text-center">
          <p className={eyebrowClass}>TOGETHER MAKES A BETTER TIME</p>
          <h1 className="my-4 mb-5 text-[50px] leading-[1.08] font-black tracking-[-0.04em] max-[1535px]:text-[44px] max-md:text-[clamp(34px,10vw,48px)]">
            함께 만드는
            <br />
            가장 <strong className="text-brand-500">좋은 시간</strong>
          </h1>
          <p className="text-base leading-7 text-ink-700 max-md:text-[15px]">
            모임, 스터디, 프로젝트, 약속까지
            <br />모두가 가능한 시간을 쉽고 빠르게 찾아보세요.
            <span className="max-[1535px]:hidden">
              <br />여러 사람의 시간을 모아 모두에게 좋은 시간을 찾아드립니다.
            </span>
          </p>
          <div className="mt-7">
            <form className="flex h-11 w-full min-w-0 max-w-[430px] gap-2 max-md:max-w-none" onSubmit={joinCalendar} noValidate>
              <label className="sr-only" htmlFor="calendar-share-link">캘린더 공유 링크</label>
              <input className="min-w-0 flex-1 rounded-[11px] border border-[#d6e2f1] bg-white px-3 text-sm text-[#263d61] outline-0 focus:border-[#72adff] focus:ring-3 focus:ring-[#e9f3ff]" id="calendar-share-link" value={shareLink} onChange={(event) => { setShareLink(event.target.value); setShareLinkError(null); }} placeholder="공유 링크 붙여넣기" />
              <button className={`${buttonClass} ${primaryButtonClass} h-11 min-h-11 shrink-0 px-[18px] py-0 text-sm max-[420px]:px-3`} type="submit"><Link2 size={18} /><span>링크로 참여하기</span></button>
            </form>
          </div>
          {shareLinkError && <p className="mt-2 mb-0 text-xs text-[#cf4b4b]" role="alert">{shareLinkError}</p>}
          <small className="mt-2 block text-[13px] text-[#788ba6] max-md:hidden">지금 바로 무료로 시작할 수 있어요.</small>
        </div>

        <div className="relative min-h-[380px] max-[1535px]:min-h-[310px] max-md:mt-4 max-md:min-h-[292px] max-[480px]:mt-[18px] max-[480px]:min-h-[282px] max-[420px]:min-h-[265px]" aria-label="일정 조율 화면 예시">
          <div className="absolute top-5 left-[12%] h-[315px] w-[64%] overflow-hidden rounded-[18px] border border-[#dfeaf7] bg-white shadow-[0_28px_70px_rgba(55,101,158,0.13)] max-[1535px]:top-3 max-[1535px]:left-[8%] max-[1535px]:h-[278px] max-[1535px]:w-[73%] max-[1535px]:rounded-[14px] max-md:top-[30px] max-md:left-[17%] max-md:h-56 max-md:w-[78%] max-md:rotate-[4.5deg] max-md:rounded-[18px] max-md:shadow-[0_20px_48px_rgba(47,90,142,0.17)] max-[480px]:top-7 max-[480px]:left-[14%] max-[480px]:h-[220px] max-[480px]:w-[80%] max-[420px]:left-[16%] max-[420px]:h-[206px]">
            <div className="flex h-[42px] items-center gap-[7px] bg-[#f6f9fd] px-[15px] max-[1535px]:h-[34px] max-md:h-[30px] [&>span]:size-[9px] [&>span]:rounded-full [&>span]:bg-[#ff8b7a] max-md:[&>span]:size-[7px] [&>span:nth-child(2)]:bg-[#ffd467] [&>span:nth-child(3)]:bg-[#65d6a0]">
              <span></span><span></span><span></span><i className="ml-3 h-[13px] flex-1 rounded-[7px] bg-[#eaf0f7]"></i>
            </div>
            <div className="px-7 py-[18px] max-[1535px]:px-5 max-[1535px]:py-[15px] max-md:px-3.5 max-md:py-3">
              <div className="mb-[18px] flex items-center justify-between max-[1535px]:mb-3 max-[1535px]:text-xs max-md:mb-2 max-md:text-[11px]"><b>2026년 9월</b><span>›</span></div>
              <div className="mb-[7px] grid grid-cols-7 gap-[5px] text-center text-[11px] text-[#8998ad] max-[1535px]:mb-[5px] max-[1535px]:text-[9px] max-md:mb-1 max-md:gap-[3px] max-md:text-[8px]">
                <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
              </div>
              <div className="grid grid-cols-7 gap-[5px] text-center max-md:gap-[3px]">
                {days.flat().map((day, index) => (
                  <span
                    key={`${day}-${index}`}
                    className={`grid h-8 place-items-center rounded-[7px] text-xs text-[#52627c] max-[1535px]:h-[27px] max-[1535px]:text-[10px] max-md:h-[21px] max-md:text-[8px] ${index === 17 ? 'bg-brand-500 text-white shadow-[0_8px_18px_rgba(22,119,255,0.28)]' : [9, 15, 23].includes(index) ? 'bg-[#e7f7ef] text-[#15935a]' : ''}`}
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute top-[42px] right-[2%] w-[205px] rounded-[13px] border border-[#e4ebf5] bg-white p-[18px] shadow-[0_20px_55px_rgba(55,101,158,0.14)] max-[1535px]:top-[55px] max-[1535px]:right-0 max-[1535px]:w-[156px] max-[1535px]:rounded-[10px] max-[1535px]:p-3 max-md:hidden">
            <b className="text-sm max-[1535px]:text-[11px]">참여자 (5)</b>
            {['김지수', '이현우', '박서연', '최민준', '정다은'].map((name, i) => (
              <div className="mt-3 flex items-center gap-[9px] text-xs max-[1535px]:mt-2 max-[1535px]:gap-[7px] max-[1535px]:text-[9px]" key={name}>
                <span className={`inline-grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-extrabold text-white max-[1535px]:size-[22px] max-[1535px]:text-[9px] ${['bg-[#3e8cf7]','bg-[#57b19c]','bg-[#ff926f]','bg-[#7b72e8]','bg-[#d5799b]'][i]}`}>{name[0]}</span>
                <span>{name}</span>
                <i className={`ml-auto size-[7px] rounded-full ${i === 4 ? 'bg-[#83a8ff]' : 'bg-[#17b876]'}`}></i>
              </div>
            ))}
          </div>
          <div className="absolute top-[74px] left-[2%] rounded-[19px] bg-white px-3.5 py-2.5 text-xs font-bold shadow-[0_12px_30px_rgba(46,77,117,0.12)] max-[1535px]:top-[60px] max-[1535px]:left-0 max-[1535px]:px-2.5 max-[1535px]:py-2 max-[1535px]:text-[9px] max-md:top-[54px] max-md:px-[9px] max-md:py-[7px] max-[420px]:text-[8px]">이번 주 어때요?</div>
          <div className="absolute top-[150px] left-[15%] rounded-[19px] bg-white px-3.5 py-2.5 text-xs font-bold text-[#18a068] shadow-[0_12px_30px_rgba(46,77,117,0.12)] max-[1535px]:top-[118px] max-[1535px]:left-[6%] max-[1535px]:px-2.5 max-[1535px]:py-2 max-[1535px]:text-[9px] max-md:top-28 max-md:left-[7px] max-md:px-[9px] max-md:py-[7px] max-[420px]:text-[8px]">좋아요!</div>
          <div className="absolute top-56 left-[4%] rounded-[19px] bg-white px-3.5 py-2.5 text-xs font-bold shadow-[0_12px_30px_rgba(46,77,117,0.12)] max-[1535px]:top-[174px] max-[1535px]:left-0 max-[1535px]:px-2.5 max-[1535px]:py-2 max-[1535px]:text-[9px] max-md:top-[166px] max-md:px-[9px] max-md:py-[7px] max-[420px]:text-[8px]">저도 가능해요?</div>
          <div className="absolute right-[18%] bottom-3.5 w-[170px] rounded-[13px] bg-white px-4 py-[13px] text-xs shadow-[0_14px_40px_rgba(46,77,117,0.13)] max-[1535px]:right-[8%] max-[1535px]:bottom-0 max-[1535px]:w-[150px] max-[1535px]:px-3 max-[1535px]:py-2.5 max-[1535px]:text-[9px] max-md:right-0 max-md:bottom-2 max-md:w-[142px] max-[420px]:w-[132px]">
            <b>9월 17일 (목)</b>
            <span className="mt-2 block text-[#4a5b74] max-md:mt-[5px]"><i className="mr-1 inline-block size-[7px] rounded-full bg-[#17b876]"></i> 4명 가능</span>
            <div className="mt-[9px] flex [&>em]:-mr-[5px] [&>em]:grid [&>em]:size-[25px] [&>em]:place-items-center [&>em]:rounded-full [&>em]:border-2 [&>em]:border-white [&>em]:bg-[#e8f1ff] [&>em]:text-[9px] [&>em]:not-italic [&>em]:text-[#235a9f] max-[1535px]:[&>em]:size-[22px] max-[1535px]:[&>em]:text-[8px]"><em>김</em><em>이</em><em>박</em><em>+1</em></div>
          </div>
          <div className="absolute -right-[2%] bottom-3 rotate-[-7deg] text-[13px] font-extrabold text-[#2f7cf3] max-[1535px]:-right-[1%] max-[1535px]:bottom-1 max-[1535px]:text-[11px] max-md:hidden">함께하면<br />더 좋은 시간이 돼요!</div>
        </div>
      </div>
    </section>
  );
}
