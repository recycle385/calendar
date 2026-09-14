import { assetUrl, hideUnavailableAsset } from '../assets/assetUrl'

const googleIconUrl = assetUrl('main/icons/google_icon.webp')

interface GoogleIconProps {
  className?: string
}

export function GoogleIcon({ className }: GoogleIconProps) {
  return (
    <img
      className={`block size-[22px] shrink-0 object-contain${className ? ` ${className}` : ''}`}
      src={googleIconUrl}
      alt=""
      aria-hidden="true"
      onError={hideUnavailableAsset}
    />
  )
}
