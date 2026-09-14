import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import {
  handleGoogleCallback,
  type GoogleCallbackLoginResponse,
  type GoogleCallbackPendingSignupResponse,
} from '../../../../domains/auth'
import { buttonClass, primaryButtonClass } from '../../../../shared/ui/styles'
import { useAuth } from '../../../providers/AuthProvider'

type CallbackResult = GoogleCallbackLoginResponse | GoogleCallbackPendingSignupResponse

const callbackTasks = new Map<string, Promise<CallbackResult>>()

function exchangeGoogleCode(code: string, state: string) {
  const taskKey = `${code}:${state}`
  const existingTask = callbackTasks.get(taskKey)

  if (existingTask) return existingTask

  const task = handleGoogleCallback(code, state)
  callbackTasks.set(taskKey, task)
  return task
}

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { completeLogin } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      setError('로그인 정보를 확인할 수 없습니다. 다시 시작해주세요.')
      return
    }

    let active = true

    void exchangeGoogleCode(code, state)
      .then((result) => {
        if (!active) return

        if ('signupToken' in result) {
          navigate('/signup', { replace: true, state: { signupToken: result.signupToken } })
          return
        }

        completeLogin(result.accessToken, result.user)
        navigate('/', { replace: true })
      })
      .catch(() => {
        if (active) {
          setError('로그인 처리에 실패했습니다. Google 로그인을 다시 시작해주세요.')
        }
      })

    return () => {
      active = false
    }
  }, [completeLogin, navigate, searchParams])

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_50%_20%,#edf7ff_0,#fff_52%)] px-5 py-12">
      <section className="grid w-full max-w-[460px] justify-items-center gap-5 rounded-3xl border border-[#e0eaf5] bg-white p-10 text-center shadow-[0_24px_60px_rgba(64,104,153,0.12)] max-sm:p-7" aria-live="polite">
        {error ? (
          <>
            <h1 className="m-0 text-[26px] font-black text-ink-900">로그인을 완료하지 못했어요.</h1>
            <p className="m-0 leading-7 text-[#7185a3]">{error}</p>
            <Link className={`${buttonClass} ${primaryButtonClass}`} to="/login">
              로그인 다시 시작하기
            </Link>
          </>
        ) : (
          <>
            <span className="size-10 animate-spin rounded-full border-4 border-[#dce9f8] border-t-brand-500" aria-hidden="true" />
            <h1 className="m-0 text-[26px] font-black text-ink-900">로그인 정보를 확인하고 있어요.</h1>
            <p className="m-0 text-[#7185a3]">잠시만 기다려주세요.</p>
          </>
        )}
      </section>
    </main>
  )
}
