import { Link2 } from 'lucide-react';
import { assetUrl } from '../../../../shared/assets/assetUrl';

const days = [
  ['30', '31', '1', '2', '3', '4', '5'],
  ['6', '7', '8', '9', '10', '11', '12'],
  ['13', '14', '15', '16', '17', '18', '19'],
  ['20', '21', '22', '23', '24', '25', '26'],
  ['27', '28', '29', '30', '1', '2', '3'],
];

const placeholderImageUrl = assetUrl('main/dotoffice_header_logo.webp');

export function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="hero" id="top">
      <div className="shell hero-grid">
        <div className="mobile-hero-top" aria-hidden="true">
          <div className="mobile-hero-note">
            좋은 사람들이
            <br />좋은 시간을 만들어요!
          </div>
          <img className="mobile-hero-art" src={placeholderImageUrl} alt="" />
        </div>

        <div className="hero-copy">
          <p className="eyebrow">TOGETHER MAKES A BETTER TIME</p>
          <h1>
            함께 만드는
            <br />
            가장 <strong>좋은 시간</strong>
          </h1>
          <p className="hero-description">
            모임, 스터디, 프로젝트, 약속까지
            <br />모두가 가능한 시간을 쉽고 빠르게 찾아보세요.
            <span className="hero-description-extra">
              <br />여러 사람의 시간을 모아 모두에게 좋은 시간을 찾아드립니다.
            </span>
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href={isAuthenticated ? '#my-calendars' : '/login'}>
              {isAuthenticated ? (
                <span>내 캘린더 보기</span>
              ) : (
                <>
                  <span className="google-dot hero-google">G</span>
                  <span className="hero-label-wide">Google로 시작하기</span>
                  <span className="hero-label-tablet">지금 시작하기 →</span>
                </>
              )}
            </a>
            <a className="button button-secondary" href="#features">
              <Link2 className="hero-link-icon" size={18} />
              <span className="hero-label-wide">링크로 참여하기</span>
              <span className="hero-label-tablet">서비스 소개 보기</span>
            </a>
          </div>
          <small>지금 바로 무료로 시작할 수 있어요.</small>
        </div>

        <div className="hero-visual" aria-label="일정 조율 화면 예시">
          <div className="browser-window">
            <div className="browser-bar">
              <span></span><span></span><span></span><i></i>
            </div>
            <div className="calendar-panel">
              <div className="calendar-title"><b>2026년 9월</b><span>›</span></div>
              <div className="weekdays">
                <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
              </div>
              <div className="calendar-grid">
                {days.flat().map((day, index) => (
                  <span
                    key={`${day}-${index}`}
                    className={index === 17 ? 'picked' : [9, 15, 23].includes(index) ? 'possible' : ''}
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="participants-card">
            <b>참여자 (5)</b>
            {['김지수', '이현우', '박서연', '최민준', '정다은'].map((name, i) => (
              <div className="participant" key={name}>
                <span className={`avatar avatar-${i + 1}`}>{name[0]}</span>
                <span>{name}</span>
                <i className={i === 4 ? 'idle' : ''}></i>
              </div>
            ))}
          </div>
          <div className="speech speech-1">이번 주 어때요?</div>
          <div className="speech speech-2">좋아요!</div>
          <div className="speech speech-3">저도 가능해요?</div>
          <div className="selected-date">
            <b>9월 17일 (목)</b>
            <span><i></i> 4명 가능</span>
            <div className="mini-avatars"><em>김</em><em>이</em><em>박</em><em>+1</em></div>
          </div>
          <div className="scribble">함께하면<br />더 좋은 시간이 돼요!</div>
        </div>
      </div>
    </section>
  );
}
