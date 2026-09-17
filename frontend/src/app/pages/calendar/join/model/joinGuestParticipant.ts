import {
  enterGuestParticipant,
  type EnterGuestParticipantResponse,
} from '../../../../../domains/participant'

export async function joinGuestParticipant(
  slug: string,
  nickname: string,
  password: string,
): Promise<EnterGuestParticipantResponse> {
  return enterGuestParticipant(slug, { nickname, password })
}
