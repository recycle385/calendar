const DAY_IN_MS = 24 * 60 * 60 * 1000
const KOREAN_DATE_PARTS_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function parseDateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

export function getDaysUntilCalendarDate(value: string, now = new Date()) {
  const parts = Object.fromEntries(
    KOREAN_DATE_PARTS_FORMATTER.formatToParts(now).map(({ type, value: partValue }) => [type, partValue]),
  )
  const today = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day))
  return Math.ceil((parseDateOnly(value) - today) / DAY_IN_MS)
}

export function getCalendarVoteState(
  isClosed: boolean,
  daysUntilEnd: number,
  daysUntilStart = 0,
) {
  if (!isClosed && daysUntilStart > 0) {
    return {
      label: '시작 전',
      className: 'bg-[#eaf3ff] text-[#4d83c4]',
      accentClassName: 'text-[#5b7fab]',
    }
  }
  if (isClosed && daysUntilEnd >= 0) {
    return {
      label: '조기 마감',
      className: 'bg-[#edf1f6] text-[#667993]',
      accentClassName: 'text-[#7488a4]',
    }
  }
  if (isClosed || daysUntilEnd < 0) {
    return {
      label: '마감',
      className: 'bg-[#edf1f6] text-[#667993]',
      accentClassName: 'text-[#7488a4]',
    }
  }
  if (daysUntilEnd === 0) {
    return {
      label: '오늘 마감',
      className: 'bg-[#ffe4e4] text-[#d83d3d]',
      accentClassName: 'text-[#d83d3d]',
    }
  }
  if (daysUntilEnd === 1) {
    return {
      label: '내일 마감',
      className: 'bg-[#ffead5] text-[#d96b13]',
      accentClassName: 'text-[#d96b13]',
    }
  }
  if (daysUntilEnd <= 3) {
    return {
      label: '마감 임박',
      className: 'bg-[#fff2cf] text-[#bd7410]',
      accentClassName: 'text-[#bd7410]',
    }
  }
  return {
    label: '진행 중',
    className: 'bg-[#ddf7e8] text-[#178753]',
    accentClassName: 'text-[#0f9b67]',
  }
}
