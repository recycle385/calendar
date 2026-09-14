import { assetUrl, hideUnavailableAsset } from "../assets/assetUrl";

export function Brand() {
  return (
    <a className="inline-flex shrink-0 items-center" href="/" aria-label="moim 홈">
      <img
        className="h-8 w-auto object-contain"
        src={assetUrl("main/icons/moim-logo.webp")}
        alt=""
        onError={hideUnavailableAsset}
      />
      <img
        className="ml-[5px] h-[27px] w-auto object-contain"
        src={assetUrl("main/icons/moim-logo-text.webp")}
        alt="moim"
        onError={hideUnavailableAsset}
      />
    </a>
  );
}
