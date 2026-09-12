import { isApiError } from '../../../shared/api/httpClient'
import { loginParticipant } from '../api/participantApi'
import {
  isParticipantSessionUsable,
  removeParticipantToken,
  setParticipantSession,
  type ParticipantSession,
} from './session'

export class ParticipantReentryRequiredError extends Error {
  constructor() {
    super('참여 세션을 다시 확인해야 합니다.')
    this.name = 'ParticipantReentryRequiredError'
  }
}

interface ParticipantRequestOptions<T> {
  slug: string
  session: ParticipantSession
  currentUserUuid: string | null
  mainAccessToken: string | null
  request: (participantToken: string) => Promise<T>
  onSessionChanged?: (session: ParticipantSession | null) => void
}

export async function runParticipantRequest<T>({
  slug,
  session,
  currentUserUuid,
  mainAccessToken,
  request,
  onSessionChanged,
}: ParticipantRequestOptions<T>) {
  if (!isParticipantSessionUsable(session, currentUserUuid)) {
    removeParticipantToken(slug)
    onSessionChanged?.(null)
    throw new ParticipantReentryRequiredError()
  }

  try {
    return await request(session.participantToken)
  } catch (error) {
    if (!isApiError(error) || error.status !== 401) throw error
  }

  if (!session.linkedUserUuid || session.linkedUserUuid !== currentUserUuid || !mainAccessToken) {
    removeParticipantToken(slug)
    onSessionChanged?.(null)
    throw new ParticipantReentryRequiredError()
  }

  try {
    const result = await loginParticipant(slug, {}, mainAccessToken)
    const refreshedSession: ParticipantSession = {
      participantToken: result.participantToken,
      participantUuid: result.participant.uuid,
      linkedUserUuid: currentUserUuid,
    }
    setParticipantSession(slug, refreshedSession)
    onSessionChanged?.(refreshedSession)
    return await request(refreshedSession.participantToken)
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      removeParticipantToken(slug)
      onSessionChanged?.(null)
      throw new ParticipantReentryRequiredError()
    }
    throw error
  }
}

export function isParticipantReentryRequiredError(error: unknown): error is ParticipantReentryRequiredError {
  return error instanceof ParticipantReentryRequiredError
}
