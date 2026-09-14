import { assetUrl, hideUnavailableAsset } from "../assets/assetUrl";

export function Brand() {
  return (
    <a className="brand" href="/" aria-label="moim 홈">
      <img
        className="brand-logo"
        src={assetUrl("main/icons/moim-logo.webp")}
        alt="moim-logo"
        onError={hideUnavailableAsset}
      />
      <img
        className="brand-logo brand-logo-text"
        src={assetUrl("main/icons/moim-logo-text.webp")}
        alt="moim-logo-text"
        onError={hideUnavailableAsset}
      />
    </a>
  );
}
