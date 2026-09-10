import { assetUrl } from '../../../../shared/assets/assetUrl';

const placeholderImageUrl = assetUrl('main/dotoffice_header_logo.webp');

export function CtaSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="section cta-section">
      <div className="shell cta-panel">
        <div className="cta-people"><img src={placeholderImageUrl} alt="" /></div>
        <div className="cta-copy">
          <p className="eyebrow">TOGETHER, A BETTER TIME</p>
          <h2>지금, 더 좋은 시간을 만들어보세요</h2>
          <p>캘린더 하나로 시작하는 더 쉬운 약속.</p>
        </div>
        <div className="cta-action">
          <a className="button button-primary" href={isAuthenticated ? '#my-calendars' : '/login'}>
            {isAuthenticated ? (
              <span>내 캘린더 보기</span>
            ) : (
              <>
                <span className="google-dot cta-google">G</span>
                <span className="cta-label-wide">Google로 시작하기</span>
                <span className="cta-label-tablet">무료로 시작하기 →</span>
              </>
            )}
          </a>
          <small>별도의 가입 절차 없이 시작할 수 있어요.</small>
        </div>
      </div>
    </section>
  );
}
