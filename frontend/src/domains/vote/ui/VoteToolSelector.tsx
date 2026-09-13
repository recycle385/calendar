import { Check, Minus, X } from 'lucide-react'

import type { VoteType } from '../model/types'

const voteTools = [
  { value: 'available' as const, label: '가능', description: '참석할 수 있어요.', icon: Check },
  { value: 'maybe' as const, label: '애매함', description: '상황에 따라 달라요.', icon: Minus },
  { value: 'unavailable' as const, label: '불가', description: '참석이 어려워요.', icon: X },
]

interface VoteToolSelectorProps {
  disabled: boolean
  value: VoteType
  onChange: (value: VoteType) => void
}

export function VoteToolSelector({ disabled, value, onChange }: VoteToolSelectorProps) {
  return (
    <div className="vote-tools" aria-label="투표 상태 선택">
      {voteTools.map(({ value: toolValue, label, description, icon: Icon }) => (
        <button
          key={toolValue}
          type="button"
          disabled={disabled}
          aria-pressed={value === toolValue}
          className={`is-${toolValue}${value === toolValue ? ' is-selected' : ''}`}
          onClick={() => onChange(toolValue)}
        >
          <span className="vote-tool-icon"><Icon size={19} /></span>
          <span>
            <strong>{label}</strong>
            <small>{description}</small>
          </span>
        </button>
      ))}
    </div>
  )
}
