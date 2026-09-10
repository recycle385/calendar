import { assetUrl } from '../assets/assetUrl';

const logoUrl = assetUrl('main/dotoffice_header_logo.webp');

export function Brand() {
  return (
    <a className="brand" href="/" aria-label="moim 홈">
      <span className="brand-mark"><img src={logoUrl} alt="" /></span>
      <span>moim</span>
    </a>
  );
}
