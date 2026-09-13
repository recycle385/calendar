import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { signupWithGoogle } from '../../../../domains/auth'
import { useAuth } from '../../../providers/AuthProvider'

const signupSchema = z.object({
  isTermsAgreed: z.boolean().refine((value) => value, '이용약관과 개인정보 처리방침에 동의해주세요.'),
})

type SignupForm = z.infer<typeof signupSchema>

interface SignupLocationState {
  signupToken?: string
}

export function SignupPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { completeLogin } = useAuth()
  const [requestError, setRequestError] = useState<string | null>(null)
  const signupToken = (location.state as SignupLocationState | null)?.signupToken
  const form = useForm<SignupForm>({
    defaultValues: { isTermsAgreed: false },
    resolver: zodResolver(signupSchema),
  })

  if (!signupToken) {
    return (
      <main className="auth-page">
        <section className="auth-card auth-status-card">
          <h1>가입 정보를 찾을 수 없어요.</h1>
          <p>가입 정보는 보안을 위해 이 흐름 안에서만 유지됩니다.</p>
          <Link className="button button-primary" to="/login">
            로그인 다시 시작하기
          </Link>
        </section>
      </main>
    )
  }

  const onSubmit = async () => {
    setRequestError(null)

    try {
      const result = await signupWithGoogle({ signupToken, isTermsAgreed: true })
      completeLogin(result.accessToken, result.user)
      navigate('/', { replace: true })
    } catch {
      setRequestError('가입 처리에 실패했습니다. 잠시 후 다시 시도하거나 로그인을 새로 시작해주세요.')
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="signup-title">
        <div>
          <p className="eyebrow">ONE MORE STEP</p>
          <h1 id="signup-title">서비스 이용에 동의해주세요.</h1>
          <p>필수 약관에 동의하면 바로 캘린더를 만들 수 있어요.</p>
        </div>
        <form className="signup-form" onSubmit={form.handleSubmit(onSubmit)}>
          <label>
            <input type="checkbox" {...form.register('isTermsAgreed')} />
            <span>이용약관과 개인정보 처리방침에 동의합니다. (필수)</span>
          </label>
          {form.formState.errors.isTermsAgreed && (
            <p className="form-error" role="alert">
              {form.formState.errors.isTermsAgreed.message}
            </p>
          )}
          {requestError && (
            <p className="form-error" role="alert">
              {requestError}
            </p>
          )}
          <button className="button button-primary" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? '가입 처리 중…' : '동의하고 시작하기'}
          </button>
        </form>
      </section>
    </main>
  )
}
