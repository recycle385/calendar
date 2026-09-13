import { useEffect, useRef } from 'react'

export function useUnsavedVoteNavigationWarning(isDirty: boolean) {
  const allowNavigation = useRef(false)

  useEffect(() => {
    allowNavigation.current = false
    if (!isDirty) return

    const confirmDiscard = () => window.confirm(
      '저장하지 않은 투표 변경이 있어요. 변경을 버리고 이동할까요?\n취소하면 계속 편집할 수 있어요.',
    )
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowNavigation.current) return
      event.preventDefault()
    }
    const guardLinkNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target
      const link = target instanceof Element ? target.closest('a[href]') : null
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank' || link.hasAttribute('download')) return

      const destination = new URL(link.href, window.location.href)
      if (destination.href === window.location.href) return
      if (!confirmDiscard()) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      allowNavigation.current = true
    }

    window.addEventListener('beforeunload', warnBeforeUnload)
    document.addEventListener('click', guardLinkNavigation, true)
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload)
      document.removeEventListener('click', guardLinkNavigation, true)
    }
  }, [isDirty])
}
