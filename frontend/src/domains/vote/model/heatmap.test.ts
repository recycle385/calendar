import { describe, expect, it } from 'vitest'

import { getAvailabilityHeatLevel } from './heatmap'

describe('getAvailabilityHeatLevel', () => {
  it('전체 참여자 대비 가능 인원 비율을 4단계 히트맵으로 계산한다', () => {
    expect(getAvailabilityHeatLevel(0, 8)).toBe(0)
    expect(getAvailabilityHeatLevel(1, 8)).toBe(1)
    expect(getAvailabilityHeatLevel(3, 8)).toBe(2)
    expect(getAvailabilityHeatLevel(5, 8)).toBe(3)
    expect(getAvailabilityHeatLevel(8, 8)).toBe(4)
  })

  it('참여자가 아직 없으면 색상 단계를 만들지 않는다', () => {
    expect(getAvailabilityHeatLevel(1, 0)).toBe(0)
  })
})
