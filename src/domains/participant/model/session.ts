const PARTICIPANT_TOKEN_PREFIX = 'participantToken_'
const PARTICIPANT_SESSION_PREFIX = 'participantSession_'

export interface ParticipantSession {
  participantToken: string
  participantUuid: string
  linkedUserUuid?: string | null
}

function getStorage() {
  return typeof window === 'undefined' ? null : window.sessionStorage
}

export function getParticipantToken(slug: string) {
  const session = getParticipantSession(slug)
  return session?.participantToken ?? getStorage()?.getItem(`${PARTICIPANT_TOKEN_PREFIX}${slug}`) ?? null
}

export function setParticipantToken(slug: string, token: string) {
  getStorage()?.setItem(`${PARTICIPANT_TOKEN_PREFIX}${slug}`, token)
}

export function getParticipantSession(slug: string): ParticipantSession | null {
  const serialized = getStorage()?.getItem(`${PARTICIPANT_SESSION_PREFIX}${slug}`)
  if (!serialized) return null

  try {
    const session = JSON.parse(serialized) as ParticipantSession
    return session.participantToken && session.participantUuid ? session : null
  } catch {
    return null
  }
}

export function setParticipantSession(slug: string, session: ParticipantSession) {
  const storage = getStorage()
  storage?.setItem(`${PARTICIPANT_SESSION_PREFIX}${slug}`, JSON.stringify(session))
  storage?.setItem(`${PARTICIPANT_TOKEN_PREFIX}${slug}`, session.participantToken)
}

export function removeParticipantToken(slug: string) {
  const storage = getStorage()
  storage?.removeItem(`${PARTICIPANT_TOKEN_PREFIX}${slug}`)
  storage?.removeItem(`${PARTICIPANT_SESSION_PREFIX}${slug}`)
}

export function isParticipantSessionUsable(
  session: ParticipantSession | null,
  currentUserUuid: string | null,
) {
  if (!session) return false
  if (session.linkedUserUuid === null) return true
  return typeof session.linkedUserUuid === 'string' && session.linkedUserUuid === currentUserUuid
}

export function removeLinkedParticipantSessions(userUuid?: string) {
  const storage = getStorage()
  const removed: Array<{ slug: string; participantUuid: string }> = []
  if (!storage) return removed

  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
  for (const key of keys) {
    if (!key?.startsWith(PARTICIPANT_SESSION_PREFIX)) continue
    const slug = key.slice(PARTICIPANT_SESSION_PREFIX.length)
    const session = getParticipantSession(slug)
    if (!session || session.linkedUserUuid === null) continue
    if (userUuid && session.linkedUserUuid && session.linkedUserUuid !== userUuid) continue
    removed.push({ slug, participantUuid: session.participantUuid })
    removeParticipantToken(slug)
  }
  return removed
}

export function removeParticipantSessionsExceptUser(userUuid: string) {
  const storage = getStorage()
  const removed: Array<{ slug: string; participantUuid: string }> = []
  if (!storage) return removed

  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
  for (const key of keys) {
    if (!key?.startsWith(PARTICIPANT_SESSION_PREFIX)) continue
    const slug = key.slice(PARTICIPANT_SESSION_PREFIX.length)
    const session = getParticipantSession(slug)
    if (!session || session.linkedUserUuid === null || session.linkedUserUuid === userUuid) continue
    removed.push({ slug, participantUuid: session.participantUuid })
    removeParticipantToken(slug)
  }
  return removed
}
