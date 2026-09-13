import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import {
  handleGoogleCallback,
  type GoogleCallbackLoginResponse,
  type GoogleCallbackPendingSignupResponse,
} from '../../../../domains/auth'
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
    <main className="auth-page">
      <section className="auth-card auth-status-card" aria-live="polite">
        {error ? (
          <>
            <h1>로그인을 완료하지 못했어요.</h1>
            <p>{error}</p>
            <Link className="button button-primary" to="/login">
              로그인 다시 시작하기
            </Link>
          </>
        ) : (
          <>
            <span className="auth-spinner" aria-hidden="true" />
            <h1>로그인 정보를 확인하고 있어요.</h1>
            <p>잠시만 기다려주세요.</p>
          </>
        )}
      </section>
    </main>
  )
}
