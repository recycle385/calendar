import { Check, Minus, X } from 'lucide-react'

import type { VoteType } from '../model/types'

const voteTools = [
  { value: 'available' as const, label: '가능', description: '참석할 수 있어요.', icon: Check },
  { value: 'maybe' as const, label: '애매함', description: '상황에 따라 달라요.', icon: Minus },
  { value: 'unavailable' as const, label: '불가', description: '참석이 어려워요.', icon: X },
]

const selectedToolClass: Record<VoteType, string> = {
  available: 'border-[#70d9a4] bg-[#effbf5] text-[#168a57]',
  maybe: 'border-[#f1cf78] bg-[#fff9e8] text-[#a97300]',
  unavailable: 'border-[#f4aaaa] bg-[#fff3f3] text-[#dc6060]',
}

interface VoteToolSelectorProps {
  disabled: boolean
  value: VoteType
  onChange: (value: VoteType) => void
}

export function VoteToolSelector({ disabled, value, onChange }: VoteToolSelectorProps) {
  return (
    <div className="mb-[17px] grid grid-cols-3 gap-2 max-[520px]:gap-[7px]" aria-label="투표 상태 선택">
      {voteTools.map(({ value: toolValue, label, description, icon: Icon }) => (
        <button
          key={toolValue}
          type="button"
          disabled={disabled}
          aria-pressed={value === toolValue}
          className={`flex min-h-[76px] items-center justify-center gap-2.5 rounded-xl border p-3 text-left transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70 max-[520px]:min-h-[68px] max-[520px]:flex-col max-[520px]:gap-1.5 max-[520px]:px-[5px] max-[520px]:py-[9px] max-[520px]:text-center ${value === toolValue ? selectedToolClass[toolValue] : 'border-[#e1e8f1] bg-white text-[#70839e]'}`}
          onClick={() => onChange(toolValue)}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-current/10 max-[520px]:size-8"><Icon size={19} /></span>
          <span>
            <strong className="block text-sm font-black">{label}</strong>
            <small className="mt-1 block text-xs opacity-75 max-[520px]:hidden">{description}</small>
          </span>
        </button>
      ))}
    </div>
  )
}
