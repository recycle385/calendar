import { useEffect, useState } from 'react'

import {
  getParticipantSession,
  subscribeParticipantSession,
  type ParticipantSession,
} from '../model/session'

interface SessionSnapshot {
  slug: string
  session: ParticipantSession | null
}

export function useParticipantSession(slug: string) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot>(() => ({
    slug,
    session: getParticipantSession(slug),
  }))

  useEffect(() => {
    const updateSession = () => setSnapshot({ slug, session: getParticipantSession(slug) })
    updateSession()
    return subscribeParticipantSession(slug, updateSession)
  }, [slug])

  return snapshot.slug === slug ? snapshot.session : getParticipantSession(slug)
}
