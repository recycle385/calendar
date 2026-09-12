import type { SyntheticEvent } from "react";

const assetBaseUrl = (import.meta.env.VITE_ASSET_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);
const gameAssetProxyPrefix = "/__game-assets";

export function assetUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${assetBaseUrl}${normalizedPath}`;
}

export function hideUnavailableAsset(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.visibility = "hidden";
  event.currentTarget.setAttribute("aria-hidden", "true");
}

export function resolveGameAssetUrl(
  url: string,
  baseUrl: string,
  proxyEnabled: boolean,
) {
  if (!proxyEnabled || !baseUrl) return url;

  try {
    const requestedUrl = new URL(url);
    const configuredBaseUrl = new URL(baseUrl);
    const basePath = configuredBaseUrl.pathname.replace(/\/+$/, "");
    if (requestedUrl.origin !== configuredBaseUrl.origin) return url;
    if (
      basePath &&
      requestedUrl.pathname !== basePath &&
      !requestedUrl.pathname.startsWith(`${basePath}/`)
    )
      return url;

    const proxiedPath = requestedUrl.pathname.slice(basePath.length) || "/";
    return `${gameAssetProxyPrefix}${proxiedPath}${requestedUrl.search}`;
  } catch {
    return url;
  }
}

export function gameAssetUrl(url: string) {
  return resolveGameAssetUrl(url, assetBaseUrl, import.meta.env.DEV);
}
