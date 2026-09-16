import { AlertTriangle, LoaderCircle, UserRound, UsersRound } from 'lucide-react'

import type {
  ParticipantReconciliationAction,
  ParticipantReconciliationPreview,
} from '../../../../../domains/participant'
import { buttonClass, primaryButtonClass, secondaryButtonClass } from '../../../../../shared/ui/styles'

interface ParticipantReconciliationDialogProps {
  preview?: ParticipantReconciliationPreview
  isLoading: boolean
  isSubmitting: boolean
  loadError: unknown
  actionError: unknown
  onResolve: (action: ParticipantReconciliationAction) => Promise<unknown>
  onRetry: () => Promise<unknown>
  onRecoverAccount: () => Promise<unknown>
  onDiscardGuest: () => void
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : '참여 정보를 정리하지 못했어요. 잠시 후 다시 시도해주세요.'
}

export function ParticipantReconciliationDialog({
  preview,
  isLoading,
  isSubmitting,
  loadError,
  actionError,
  onResolve,
  onRetry,
  onRecoverAccount,
  onDiscardGuest,
}: ParticipantReconciliationDialogProps) {
  const hasExistingParticipant = preview?.state === 'host-conflict'
    || preview?.state === 'participant-conflict'
  const title = preview?.state === 'host-conflict'
    ? '방장은 게스트로 참여할 수 없어요'
    : hasExistingParticipant
      ? '두 참여 기록 중 하나를 선택해주세요'
      : '게스트 참여 정보를 계정에 연결할까요?'

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-[#0a1f42]/45 px-4 py-8 backdrop-blur-[3px]">
      <section
        className="w-full max-w-[610px] rounded-[24px] border border-[#dbe7f5] bg-white p-7 shadow-[0_28px_80px_rgba(12,43,83,0.24)] max-sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="participant-reconciliation-title"
        aria-describedby="participant-reconciliation-description"
      >
        {isLoading ? (
          <div className="grid min-h-[240px] place-content-center justify-items-center gap-4 text-center">
            <LoaderCircle className="animate-spin text-brand-500" size={36} aria-hidden="true" />
            <h1 className="m-0 text-[24px] font-black text-ink-900" id="participant-reconciliation-title">
              참여 기록을 확인하고 있어요
            </h1>
            <p className="m-0 text-[15px] leading-7 text-[#657b9c]" id="participant-reconciliation-description">
              로그인 전 사용한 게스트 기록과 현재 계정을 안전하게 비교하고 있습니다.
            </p>
          </div>
        ) : loadError || !preview ? (
          <div className="grid min-h-[260px] place-content-center justify-items-center gap-4 text-center">
            <AlertTriangle className="text-[#e09020]" size={38} aria-hidden="true" />
            <h1 className="m-0 text-[24px] font-black text-ink-900" id="participant-reconciliation-title">
              참여 기록을 확인하지 못했어요
            </h1>
            <p className="m-0 max-w-[470px] text-[15px] leading-7 text-[#657b9c]" id="participant-reconciliation-description" role="alert">
              {errorMessage(loadError)}
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2.5">
              <button className={`${buttonClass} ${primaryButtonClass}`} type="button" disabled={isSubmitting} onClick={() => void onRetry()}>
                다시 확인하기
              </button>
              <button className={`${buttonClass} ${secondaryButtonClass}`} type="button" disabled={isSubmitting} onClick={() => void onRecoverAccount()}>
                계정 참여로 복구
              </button>
              <button className={`${buttonClass} ${secondaryButtonClass}`} type="button" disabled={isSubmitting} onClick={onDiscardGuest}>
                참여 화면으로 이동
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <span className="mb-3 inline-grid size-11 place-items-center rounded-full bg-[#fff4da] text-[#d98a16]">
                <AlertTriangle size={23} aria-hidden="true" />
              </span>
              <h1 className="m-0 text-[26px] font-black tracking-[-0.035em] text-ink-900" id="participant-reconciliation-title">
                {title}
              </h1>
              <p className="mt-2 mb-0 text-[15px] leading-7 text-[#657b9c]" id="participant-reconciliation-description">
                {hasExistingParticipant
                  ? '선택한 기록만 남고 다른 기록은 삭제됩니다. 날짜별 선택을 합치지는 않습니다.'
                  : '투표와 별명은 유지한 채 로그인 계정에 연결합니다. 이후에는 비밀번호 없이 들어올 수 있어요.'}
              </p>
            </div>

            {hasExistingParticipant && preview.accountParticipant && !preview.voteChangesAllowed ? (
              <div className="rounded-2xl border border-[#f1dfb9] bg-[#fff8e9] p-5 text-center">
                <strong className="block text-[17px] text-ink-900">마감된 투표 기록은 변경할 수 없어요</strong>
                <span className="mt-2 block text-[14px] leading-6 text-[#657b9c]">
                  기존 계정 참여 기록으로 결과를 확인할 수 있습니다. 게스트 기록은 그대로 보존됩니다.
                </span>
                <button
                  className={`${buttonClass} ${primaryButtonClass} mt-4`}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void onRecoverAccount()}
                >
                  계정 참여로 계속하기
                </button>
              </div>
            ) : hasExistingParticipant && preview.accountParticipant ? (
              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <button
                  className="grid min-h-[154px] cursor-pointer content-start gap-2 rounded-2xl border border-[#d9e5f3] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-50 disabled:cursor-wait disabled:opacity-60"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void onResolve('keep-account')}
                >
                  <UserRound className="text-brand-500" size={25} aria-hidden="true" />
                  <strong className="text-[17px] text-ink-900">
                    {preview.state === 'host-conflict' ? '방장 기록 사용' : '계정 기록 사용'}
                  </strong>
                  <span className="text-[14px] leading-6 text-[#657b9c]">
                    {preview.accountParticipant.nickname} · 투표 {preview.accountParticipant.voteCount}개
                  </span>
                </button>
                <button
                  className="grid min-h-[154px] cursor-pointer content-start gap-2 rounded-2xl border border-[#d9e5f3] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-50 disabled:cursor-wait disabled:opacity-60"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void onResolve('use-guest-votes')}
                >
                  <UsersRound className="text-brand-500" size={25} aria-hidden="true" />
                  <strong className="text-[17px] text-ink-900">게스트 기록 사용</strong>
                  <span className="text-[14px] leading-6 text-[#657b9c]">
                    {preview.guest.nickname} · 투표 {preview.guest.voteCount}개
                  </span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <button
                  className="grid min-h-[154px] cursor-pointer content-start gap-2 rounded-2xl border border-[#d9e5f3] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-50 disabled:cursor-wait disabled:opacity-60"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void onResolve('claim-account')}
                >
                  <UserRound className="text-brand-500" size={25} aria-hidden="true" />
                  <strong className="text-[17px] text-ink-900">내 계정 이름으로 참여</strong>
                  <span className="text-[14px] leading-6 text-[#657b9c]">{preview.accountNickname} 이름으로 표시합니다.</span>
                </button>
                <button
                  className="grid min-h-[154px] cursor-pointer content-start gap-2 rounded-2xl border border-[#d9e5f3] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-50 disabled:cursor-wait disabled:opacity-60"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void onResolve('claim-alias')}
                >
                  <UsersRound className="text-brand-500" size={25} aria-hidden="true" />
                  <strong className="text-[17px] text-ink-900">현재 별명으로 계속 참여</strong>
                  <span className="text-[14px] leading-6 text-[#657b9c]">{preview.guest.nickname} 별명과 투표를 유지합니다.</span>
                </button>
              </div>
            )}

            {actionError ? (
              <p className="mt-4 mb-0 rounded-xl bg-[#fff1f1] px-4 py-3 text-center text-[14px] font-bold leading-6 text-[#cf3f4f]" role="alert">
                {errorMessage(actionError)}
              </p>
            ) : null}

            {isSubmitting ? (
              <p className="mt-4 mb-0 flex items-center justify-center gap-2 text-[14px] font-bold text-brand-600" aria-live="polite">
                <LoaderCircle className="animate-spin" size={17} aria-hidden="true" /> 참여 기록을 정리하고 있어요.
              </p>
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}
