export const CALENDAR_PAGE_SIZE = 6

export function paginateCalendars<T>(items: T[], requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / CALENDAR_PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages)
  const startIndex = (currentPage - 1) * CALENDAR_PAGE_SIZE

  return {
    currentPage,
    emptySlotCount: CALENDAR_PAGE_SIZE - Math.min(items.length - startIndex, CALENDAR_PAGE_SIZE),
    totalPages,
    visibleItems: items.slice(startIndex, startIndex + CALENDAR_PAGE_SIZE),
  }
}
