import { Link } from 'react-router-dom';

import { PRIVACY_ROUTE, TERMS_ROUTE } from '../constants/routes';
import { Brand } from './Brand';
import { shellClass } from './styles';

export function Footer() {
  return (
    <footer className="border-t border-[#e7edf5] bg-[#f8fbff] py-9 text-sm text-[#6d809c]">
      <div className={`${shellClass} grid grid-cols-[1fr_auto] items-center gap-x-12 gap-y-6 max-md:grid-cols-1 max-md:text-center`}>
        <div>
          <Brand />
          <p className="mt-3 mb-0 text-sm">함께 만드는 더 좋은 시간</p>
        </div>
        <div className="flex flex-wrap justify-end gap-6 font-bold max-md:justify-center">
          <Link className="hover:text-brand-500" to={TERMS_ROUTE}>
            이용약관
          </Link>
          <Link className="hover:text-brand-500" to={PRIVACY_ROUTE}>
            개인정보처리방침
          </Link>
          <a href="https://github.com/recycle385/calendar" target="_blank" rel="noreferrer">GitHub</a>
        </div>
        <div className="col-span-full border-t border-[#e7edf5] pt-5 text-[13px] max-md:col-span-1">
          <span>© 2026 moim. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
