import { describe, expect, it } from 'vitest'
import { matchPath } from 'react-router-dom'

import { getCalendarJoinPath, LEGACY_CALENDAR_SHARE_ROUTE } from './index'

describe('공유 링크 호환 경로', () => {
  it('백엔드의 /calendar/:slug 공유 링크를 참여 경로로 변환한다', () => {
    const match = matchPath(LEGACY_CALENDAR_SHARE_ROUTE, '/calendar/b569910c3d7200df')

    expect(match?.params.slug).toBe('b569910c3d7200df')
    expect(getCalendarJoinPath(match?.params.slug ?? '')).toBe('/c/b569910c3d7200df/join')
  })
})
