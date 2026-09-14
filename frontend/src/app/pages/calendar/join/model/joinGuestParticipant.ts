import {
  loginParticipant,
  registerParticipant,
  type LoginParticipantResponse,
  type RegisterParticipantResponse,
} from '../../../../../domains/participant'
import { isApiError } from '../../../../../shared/api/httpClient'

type GuestParticipantResponse = LoginParticipantResponse | RegisterParticipantResponse

export async function joinGuestParticipant(
  slug: string,
  nickname: string,
  password: string,
): Promise<GuestParticipantResponse> {
  try {
    return await loginParticipant(slug, { nickname, password })
  } catch (loginError) {
    if (!isApiError(loginError) || loginError.status !== 401) throw loginError

    try {
      return await registerParticipant(slug, { nickname, password })
    } catch (registerError) {
      if (isApiError(registerError) && registerError.status === 409) throw loginError
      throw registerError
    }
  }
}
