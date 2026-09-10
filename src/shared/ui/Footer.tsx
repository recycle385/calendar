import { Camera, MessageCircle, Play } from 'lucide-react';
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
          <a href="#">이용약관</a>
          <a href="#">개인정보처리방침</a>
          <a href="#">문의하기</a>
          <a href="#">GitHub</a>
        </div>
        <div className="footer-meta">
          <div className="socials">
            <a href="#" aria-label="영상"><Play size={16} /></a>
            <a href="#" aria-label="사진"><Camera size={16} /></a>
            <a href="#" aria-label="문의"><MessageCircle size={16} /></a>
          </div>
          <span>© 2026 moim. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
