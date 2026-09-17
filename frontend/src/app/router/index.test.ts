import { describe, expect, it } from 'vitest'
import { matchPath } from 'react-router-dom'

import { getCalendarJoinPath, LEGACY_CALENDAR_SHARE_ROUTE } from './index'
import { PRIVACY_ROUTE, TERMS_ROUTE } from '../../shared/constants/routes'

describe('공유 링크 호환 경로', () => {
  it('백엔드의 /calendar/:slug 공유 링크를 참여 경로로 변환한다', () => {
    const match = matchPath(LEGACY_CALENDAR_SHARE_ROUTE, '/calendar/b569910c3d7200df')

    expect(match?.params.slug).toBe('b569910c3d7200df')
    expect(getCalendarJoinPath(match?.params.slug ?? '')).toBe('/c/b569910c3d7200df/join')
  })
})

describe('법적 고지 경로', () => {
  it('이용약관과 개인정보처리방침에 고정된 공개 경로를 사용한다', () => {
    expect(TERMS_ROUTE).toBe('/terms')
    expect(PRIVACY_ROUTE).toBe('/privacy')
  })
})
