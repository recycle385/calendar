const CALENDAR_SHARE_PATH = /^\/(?:c|calendar)\/([^/]+)(?:\/join)?\/?$/

export function parseCalendarJoinPath(input: string, currentOrigin: string) {
  try {
    const url = new URL(input.trim(), currentOrigin)
    if (url.origin !== currentOrigin) return null

    const match = url.pathname.match(CALENDAR_SHARE_PATH)
    if (!match?.[1]) return null

    return `/c/${encodeURIComponent(decodeURIComponent(match[1]))}/join`
  } catch {
    return null
  }
}
