const names = ['김지수', '이현우', '박서연', '최민준', '정다은'];
const states = ['가능', '가능', '가능', '보류', '불가능'];

export function ValueSection() {
  return (
    <section className="section value-section">
      <div className="shell value-panel">
        <div className="value-copy">
          <p className="eyebrow value-eyebrow">
            <span className="value-label-wide">한눈에 확인하는 투표 현황</span>
            <span className="value-label-mobile">REAL-TIME VOTING</span>
          </p>
          <h2>모두의 가능한 시간이<br />바로 보입니다.</h2>
          <p>
            달력에서 가능한 시간을 선택하면
            <br />실시간으로 투표 현황이 반영됩니다.
          </p>
          <ul>
            <li>참여자별 응답 현황을 한눈에</li>
            <li>날짜별 투표 결과를 실시간으로</li>
            <li>모두가 가능한 최적의 시간 제안</li>
          </ul>
        </div>

        <div className="value-visual" aria-label="실시간 투표 현황 예시">
          <div className="value-calendar">
            <div className="browser-bar"><span></span><span></span><span></span><i></i></div>
            <div className="calendar-title"><b>2026년 9월</b><span>›</span></div>
            <div className="weekdays">
              <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
            </div>
            <div className="calendar-grid compact">
              {Array.from({ length: 35 }, (_, i) => (
                <span
                  key={i}
                  className={i === 17 ? 'picked' : [9, 15, 23, 25].includes(i) ? 'possible' : ''}
                >
                  {(i + 30) % 30 + 1}
                </span>
              ))}
            </div>
          </div>

          <div className="availability-card">
            <b className="availability-wide-title">9월 17일 (목)</b>
            <b className="availability-mobile-title">참여자 5명</b>
            <small className="availability-wide-title">4명 가능</small>
            {names.map((name, i) => (
              <div key={name}>
                <span className={`avatar avatar-${i + 1}`}>{name[0]}</span>
                <span>{name}</span>
                <em className={states[i]}>{states[i]}</em>
                <i className={`availability-dot ${states[i] === '불가능' ? 'no' : states[i] === '보류' ? 'maybe' : ''}`} />
              </div>
            ))}
            <button>이 날짜로 선택하기</button>
          </div>

          <div className="value-mobile-date-card">
            <b>9월 17일 (목)</b>
            <span><i />4명 가능</span>
            <div className="mini-avatars"><em>김</em><em>이</em><em>박</em><em>+1</em></div>
          </div>
        </div>
      </div>
    </section>
  );
}
