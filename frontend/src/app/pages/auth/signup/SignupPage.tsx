import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { signupWithGoogle } from '../../../../domains/auth'
import { buttonClass, eyebrowClass, primaryButtonClass } from '../../../../shared/ui/styles'
import { useAuth } from '../../../providers/AuthProvider'

const authPageClass = 'grid min-h-screen place-items-center bg-[radial-gradient(circle_at_50%_20%,#edf7ff_0,#fff_52%)] px-5 py-12'
const authCardClass = 'grid w-full max-w-[460px] gap-7 rounded-3xl border border-[#e0eaf5] bg-white p-10 text-center shadow-[0_24px_60px_rgba(64,104,153,0.12)] max-sm:p-7'

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
      <main className={authPageClass}>
        <section className={`${authCardClass} justify-items-center`}>
          <h1 className="m-0 text-[26px] font-black tracking-[-0.04em] text-ink-900">가입 정보를 찾을 수 없어요.</h1>
          <p className="m-0 leading-7 text-[#7185a3]">가입 정보는 보안을 위해 이 흐름 안에서만 유지됩니다.</p>
          <Link className={`${buttonClass} ${primaryButtonClass}`} to="/login">
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
    <main className={authPageClass}>
      <section className={authCardClass} aria-labelledby="signup-title">
        <div>
          <p className={eyebrowClass}>ONE MORE STEP</p>
          <h1 className="mt-3 mb-2 text-[30px] font-black tracking-[-0.05em] text-ink-900" id="signup-title">서비스 이용에 동의해주세요.</h1>
          <p className="m-0 leading-7 text-[#7185a3]">필수 약관에 동의하면 바로 캘린더를 만들 수 있어요.</p>
        </div>
        <form className="grid gap-4 text-left" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#dce6f3] p-4 text-sm font-bold text-[#405b7f]">
            <input className="mt-0.5 size-4 accent-brand-500" type="checkbox" {...form.register('isTermsAgreed')} />
            <span>이용약관과 개인정보 처리방침에 동의합니다. (필수)</span>
          </label>
          {form.formState.errors.isTermsAgreed && (
            <p className="m-0 text-[13px] font-bold text-[#d14343]" role="alert">
              {form.formState.errors.isTermsAgreed.message}
            </p>
          )}
          {requestError && (
            <p className="m-0 text-[13px] font-bold text-[#d14343]" role="alert">
              {requestError}
            </p>
          )}
          <button className={`${buttonClass} ${primaryButtonClass} mt-1 w-full`} type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? '가입 처리 중…' : '동의하고 시작하기'}
          </button>
        </form>
      </section>
    </main>
  )
}
