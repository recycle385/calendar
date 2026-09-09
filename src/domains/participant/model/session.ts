const PARTICIPANT_TOKEN_PREFIX = 'participantToken_'

function getStorage() {
  return typeof window === 'undefined' ? null : window.sessionStorage
}

export function getParticipantToken(slug: string) {
  return getStorage()?.getItem(`${PARTICIPANT_TOKEN_PREFIX}${slug}`) ?? null
}

export function setParticipantToken(slug: string, token: string) {
  getStorage()?.setItem(`${PARTICIPANT_TOKEN_PREFIX}${slug}`, token)
}

export function removeParticipantToken(slug: string) {
  getStorage()?.removeItem(`${PARTICIPANT_TOKEN_PREFIX}${slug}`)
}
