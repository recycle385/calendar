const KST_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function formatDate(value: string) {
  const dateOnly = value.slice(0, 10)
  const [year, month, day] = dateOnly.split('-')

  if (!year || !month || !day) return value
  return `${year}.${month}.${day}`
}

export function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : KST_DATE_TIME_FORMATTER.format(date)
}

export function formatPercent(value: number | string) {
  const numericValue = Number(value)
  return `${Number.isFinite(numericValue) ? numericValue.toFixed(0) : '0'}%`
}
