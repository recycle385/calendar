import { describe, expect, it } from 'vitest'
import { resolveGameAssetUrl } from './assetUrl'

describe('resolveGameAssetUrl', () => {
  const assetBaseUrl = 'https://assets.example.com/root'

  it('개발 환경에서 설정된 자산 호스트 URL을 동일 출처 프록시로 변환한다', () => {
    expect(resolveGameAssetUrl('https://assets.example.com/root/myroom/frame.webp?v=4', assetBaseUrl, true))
      .toBe('/__game-assets/myroom/frame.webp?v=4')
  })

  it('운영 환경이나 다른 호스트의 URL은 변경하지 않는다', () => {
    const url = 'https://other.example.com/frame.webp'
    expect(resolveGameAssetUrl(url, assetBaseUrl, true)).toBe(url)
    expect(resolveGameAssetUrl('https://assets.example.com/root/frame.webp', assetBaseUrl, false))
      .toBe('https://assets.example.com/root/frame.webp')
  })
})
