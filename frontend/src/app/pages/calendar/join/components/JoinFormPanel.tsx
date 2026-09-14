import { LogIn, UserRound } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import { FieldError } from '../../components/FieldError'
import { buttonClass, panelClass, primaryButtonClass } from '../../../../../shared/ui/styles'
import type { JoinForm, JoinMode } from '../model/joinForm'

const choiceClass = 'flex items-center gap-2.5 rounded-[11px] border p-3.5 text-left [&_strong]:block [&_strong]:text-[13px] [&_strong]:text-[#29486f] [&_small]:mt-[3px] [&_small]:block [&_small]:text-xs [&_small]:text-[#8798b0]'
const labelClass = 'grid gap-2 text-[13px] font-extrabold text-[#2d486e] [&_em]:text-[#f05252] [&_em]:not-italic [&>small]:text-xs [&>small]:font-medium [&>small]:text-[#8495ae]'
const inputClass = 'w-full rounded-[10px] border border-[#d5e2f1] bg-white px-[13px] py-3 text-[#233c62] outline-0 focus:border-[#72adff] focus:ring-3 focus:ring-[#e9f3ff]'

interface JoinFormPanelProps {
  authStatus: string
  userNickname?: string | null
  mode: JoinMode
  form: UseFormReturn<JoinForm>
  isPending: boolean
  isClosed: boolean
  joinError: string | null
  onModeChange: (mode: JoinMode) => void
  onSubmit: (values: JoinForm) => void
}

export function JoinFormPanel({
  authStatus,
  userNickname,
  mode,
  form,
  isPending,
  isClosed,
  joinError,
  onModeChange,
  onSubmit,
}: JoinFormPanelProps) {
  const isMember = mode === 'member'

  return (
    <section className={`${panelClass} p-[30px] max-[800px]:p-5`}>
      <div>
        <h1 className="m-0 text-[26px] font-black tracking-[-0.05em] text-[#17355e]">캘린더 참여하기</h1>
        <p className="mt-[7px] mb-[22px] text-[#7185a3]">내 상황에 맞는 방법을 선택해주세요.</p>
      </div>
      {authStatus === 'authenticated' ? (
        <div className="mb-5 grid grid-cols-2 gap-2.5 max-[800px]:grid-cols-1">
          <button type="button" disabled={isPending} className={`${choiceClass} ${isMember ? 'border-[#5c9eff] bg-[#f5f9ff] text-brand-500' : 'border-[#dae5f2] bg-white text-[#7183a1]'}`} onClick={() => onModeChange('member')}>
            <LogIn size={21} />
            <span><strong>{userNickname ?? '현재'} 계정으로 참여</strong><small>로그인한 계정에 캘린더를 저장해요.</small></span>
          </button>
          <button type="button" disabled={isPending} className={`${choiceClass} ${!isMember ? 'border-[#5c9eff] bg-[#f5f9ff] text-brand-500' : 'border-[#dae5f2] bg-white text-[#7183a1]'}`} onClick={() => onModeChange('guest')}>
            <UserRound size={21} />
            <span><strong>게스트로 참여</strong><small>계정과 분리해서 새로 참여해요.</small></span>
          </button>
        </div>
      ) : (
        <div className={`${choiceClass} mb-5 border-0 bg-[#f0f6ff] text-[#7183a1]`}>
          <UserRound size={20} />
          <span><strong>게스트 참여</strong><small>계정 없이도 바로 일정에 참여할 수 있어요.</small></span>
        </div>
      )}

      {isMember ? (
        <div className="flex items-center gap-[13px] rounded-xl bg-[#eff6ff] px-4 py-[22px] text-[#3774d1] [&_strong]:text-[#214a80] [&_p]:mt-1 [&_p]:mb-0 [&_p]:text-xs [&_p]:text-[#7286a4]">
          <UserRound size={24} />
          <div>
            <strong>{userNickname ?? '현재'} 계정으로 참여할까요?</strong>
            <p>참여한 캘린더는 내 계정에서 다시 확인할 수 있어요.</p>
          </div>
        </div>
      ) : (
        <form className="mt-1 grid gap-7" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <label className={labelClass}>
            <span>닉네임 <em>*</em></span>
            <input className={inputClass} {...form.register('nickname')} placeholder="캘린더에서 사용할 이름" maxLength={20} />
            <FieldError message={form.formState.errors.nickname?.message} />
          </label>
          {!isMember && (
            <label className={labelClass}>
              <span>참여 비밀번호 <em>*</em></span>
              <input className={inputClass}
                {...form.register('password')}
                type="password"
                placeholder="참여 또는 재참여에 사용할 비밀번호"
                autoComplete="new-password"
              />
              <small>비밀번호는 저장하지 않아요. 재참여 시 직접 입력해야 해요.</small>
              <FieldError message={form.formState.errors.password?.message} />
            </label>
          )}
        </form>
      )}

      {isClosed && (
        <p className="mt-[18px] mb-0 rounded-[9px] bg-[#fff7e9] p-3 text-xs leading-[1.55] text-[#b16524]" role="status">
          이 캘린더는 마감되어 기존 참가자만 다시 참여할 수 있어요.
        </p>
      )}
      {joinError && <p className="mt-3 mb-0 text-[13px] font-bold text-[#df4d4d]" role="alert">{joinError}</p>}
      <div className="mt-[22px] flex justify-end max-[520px]:items-stretch">
        <button
          className={`${buttonClass} ${primaryButtonClass}`}
          type="button"
          disabled={isPending}
          onClick={() => {
            if (isMember) onSubmit({ nickname: '', password: '' })
            else void form.handleSubmit(onSubmit)()
          }}
        >
          {isPending ? '참여 중…' : '캘린더 참여하기'} <LogIn size={18} />
        </button>
      </div>
    </section>
  )
}
