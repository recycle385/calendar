import { Link } from "react-router-dom";

import { getGoogleLoginUrl } from "../../../../domains/auth";
import { Brand } from "../../../../shared/ui/Brand";
import { GoogleIcon } from "../../../../shared/ui/GoogleIcon";
import {
  buttonClass,
  eyebrowClass,
  googleButtonClass,
} from "../../../../shared/ui/styles";

export function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_50%_20%,#edf7ff_0,#fff_52%)] px-5 py-12">
      <section
        className="grid w-full max-w-[460px] gap-7 rounded-3xl border border-[#e0eaf5] bg-white p-10 text-center shadow-[0_24px_60px_rgba(64,104,153,0.12)] max-sm:p-7"
        aria-labelledby="login-title"
      >
        <Brand />
        <div>
          <p className={eyebrowClass}>WELCOME TO MOIM</p>
          <h1
            className="mt-3 mb-2 text-[30px] font-black tracking-[-0.05em] text-ink-900"
            id="login-title"
          >
            일정을 함께 맞춰볼까요?
          </h1>
          <p className="m-0 leading-7 text-[#7185a3]">
            Google 계정으로 로그인하면 내 캘린더를 만들고 관리할 수 있어요.
          </p>
        </div>
        <a
          className={`${buttonClass} ${googleButtonClass} w-full`}
          href={getGoogleLoginUrl()}
        >
          <GoogleIcon />
          Google로 계속하기
        </a>
        <Link
          className="text-sm font-bold text-[#6681a5] hover:text-brand-500"
          to="/"
        >
          홈으로 돌아가기
        </Link>
      </section>
    </main>
  );
}
