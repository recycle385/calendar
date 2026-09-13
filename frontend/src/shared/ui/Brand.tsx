import { assetUrl, hideUnavailableAsset } from '../assets/assetUrl';

const moimLogoUrl = assetUrl('main/icons/moim-logo.webp');

export function Brand() {
  return (
    <a className="brand" href="/" aria-label="moim 홈">
      <img className="brand-logo" src={moimLogoUrl} alt="moim" onError={hideUnavailableAsset} />
    </a>
  );
}
