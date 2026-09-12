const PARTICIPANT_ROOM_PREFIX = 'participant:';

export function participantSocketRoom(participantUuid: string) {
  return `${PARTICIPANT_ROOM_PREFIX}${participantUuid}`;
}
