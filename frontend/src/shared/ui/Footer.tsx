import { Brand } from './Brand';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div>
          <Brand />
          <p>함께 만드는 더 좋은 시간</p>
        </div>
        <div className="footer-links">
          <span title="준비 중">이용약관</span>
          <span title="준비 중">개인정보처리방침</span>
          <span title="준비 중">문의하기</span>
          <a href="https://github.com/recycle385/calendar" target="_blank" rel="noreferrer">GitHub</a>
        </div>
        <div className="footer-meta">
          <span>© 2026 moim. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
