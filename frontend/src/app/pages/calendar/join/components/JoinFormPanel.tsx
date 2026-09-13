import { LogIn, UserRound } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import { FieldError } from '../../components/FieldError'
import type { JoinForm, JoinMode } from '../model/joinForm'

interface JoinFormPanelProps {
  authStatus: string
  userNickname?: string | null
  mode: JoinMode
  form: UseFormReturn<JoinForm>
  isPending: boolean
  newEntryBlocked: boolean
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
  newEntryBlocked,
  joinError,
  onModeChange,
  onSubmit,
}: JoinFormPanelProps) {
  const isExisting = mode.endsWith('existing')
  const isMember = mode.startsWith('member')

  return (
    <section className="workspace-panel join-form-panel">
      <div className="join-form-heading">
        <h1>캘린더 참여하기</h1>
        <p>내 상황에 맞는 방법을 선택해주세요.</p>
      </div>
      {authStatus === 'authenticated' ? (
        <div className="join-member-choice">
          <button type="button" className={isMember ? 'is-selected' : ''} onClick={() => onModeChange('member-existing')}>
            <LogIn size={21} />
            <span><strong>{userNickname ?? '현재'} 계정으로 참여</strong><small>로그인한 계정에 캘린더를 저장해요.</small></span>
          </button>
          <button type="button" className={!isMember ? 'is-selected' : ''} onClick={() => onModeChange('guest-new')}>
            <UserRound size={21} />
            <span><strong>게스트로 참여</strong><small>계정과 분리해서 새로 참여해요.</small></span>
          </button>
        </div>
      ) : (
        <div className="join-member-choice join-guest-notice">
          <UserRound size={20} />
          <span><strong>게스트 참여</strong><small>계정 없이도 바로 일정에 참여할 수 있어요.</small></span>
        </div>
      )}

      {isMember && isExisting ? (
        <div className="member-login-confirm">
          <UserRound size={24} />
          <div>
            <strong>{userNickname ?? '현재'} 계정으로 참여할까요?</strong>
            <p>참여한 캘린더는 내 계정에서 다시 확인할 수 있어요.</p>
          </div>
        </div>
      ) : (
        <form className="calendar-form join-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <label>
            <span>닉네임 <em>*</em></span>
            <input {...form.register('nickname')} placeholder="캘린더에서 사용할 이름" maxLength={20} />
            <FieldError message={form.formState.errors.nickname?.message} />
          </label>
          {!isMember && (
            <label>
              <span>참여 비밀번호 <em>*</em></span>
              <input
                {...form.register('password')}
                type="password"
                placeholder={isExisting ? '참여할 때 사용한 비밀번호' : '다시 참여할 때 사용할 비밀번호'}
                autoComplete="new-password"
              />
              <small>비밀번호는 저장하지 않아요. 재참여 시 직접 입력해야 해요.</small>
              <FieldError message={form.formState.errors.password?.message} />
            </label>
          )}
        </form>
      )}

      {newEntryBlocked && (
        <p className="join-closed-notice" role="status">
          이 캘린더는 마감되어 새로 참여할 수 없어요. 이전에 참여했다면 재참여를 선택해주세요.
        </p>
      )}
      {joinError && <p className="form-error workspace-request-error" role="alert">{joinError}</p>}
      <div className="join-form-actions">
        {isExisting ? (
          <button type="button" className="button button-secondary" onClick={() => onModeChange(isMember ? 'member-new' : 'guest-new')}>
            새로 참여하기
          </button>
        ) : (
          <button type="button" className="button button-secondary" onClick={() => onModeChange(isMember ? 'member-existing' : 'guest-existing')}>
            다시 참여하기
          </button>
        )}
        <button
          className="button button-primary"
          type="button"
          disabled={isPending || newEntryBlocked}
          onClick={() => {
            if (isMember && isExisting) onSubmit({ nickname: '', password: '' })
            else void form.handleSubmit(onSubmit)()
          }}
        >
          {isPending ? '참여 중…' : isExisting ? '캘린더 다시 참여하기' : '캘린더 참여하기'} <LogIn size={18} />
        </button>
      </div>
    </section>
  )
}
