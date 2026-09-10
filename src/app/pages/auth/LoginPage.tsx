import { Link } from 'react-router-dom'

import { getGoogleLoginUrl } from '../../../domains/auth'
import { Brand } from '../../../shared/ui/Brand'

export function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <Brand />
        <div>
          <p className="eyebrow">WELCOME TO MOIM</p>
          <h1 id="login-title">일정을 함께 맞춰볼까요?</h1>
          <p>Google 계정으로 로그인하면 내 캘린더를 만들고 관리할 수 있어요.</p>
        </div>
        <a className="button button-primary auth-google-button" href={getGoogleLoginUrl()}>
          <span className="google-dot">G</span>
          Google로 계속하기
        </a>
        <Link className="auth-back-link" to="/">
          홈으로 돌아가기
        </Link>
      </section>
    </main>
  )
}
