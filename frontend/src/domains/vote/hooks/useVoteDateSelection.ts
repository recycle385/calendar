import { useMemo, useState } from 'react'

import type { DateVoteStatus } from '../model/types'

export function useVoteDateSelection(enabledDates: DateVoteStatus[]) {
  const dateKeys = useMemo(
    () => enabledDates.map((item) => item.date_value.slice(0, 10)),
    [enabledDates],
  )
  const [requestedDate, setRequestedDate] = useState('')
  const selectedDate = dateKeys.includes(requestedDate) ? requestedDate : dateKeys[0] ?? ''

  return { selectedDate, setSelectedDate: setRequestedDate }
}
