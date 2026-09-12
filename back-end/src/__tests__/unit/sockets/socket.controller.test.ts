import { CalendarSocketController } from '../../../sockets/socket.controller';
import { CustomSocket } from '../../../types/socket.types';
import { Errors } from '../../../utils/errors';

function createSocket() {
  const handlers = new Map<string, (...args: never[]) => void>();
  const rooms = new Set<string>(['socket-id']);
  const socket = {
    id: 'socket-id',
    data: {
      sub: 'participant-uuid',
      nickname: '참가자',
      role: 'guest',
      calendarSlug: 'calendar-slug',
      exp: Math.floor(Date.now() / 1000) + 60,
    },
    rooms,
    on: jest.fn((event: string, handler: (...args: never[]) => void) => {
      handlers.set(event, handler);
    }),
    emit: jest.fn(),
    disconnect: jest.fn(),
    join: jest.fn(async (room: string) => {
      rooms.add(room);
    }),
    leave: jest.fn(async (room: string) => {
      rooms.delete(room);
    }),
    to: jest.fn(() => ({ emit: jest.fn() })),
    nsp: { in: jest.fn(() => ({ fetchSockets: jest.fn(async () => []) })) },
  };

  return { socket: socket as unknown as CustomSocket, handlers };
}

describe('CalendarSocketController room authorization', () => {
  it('연결 뒤 강퇴되어 참가자가 사라지면 방 재입장을 거부하고 연결을 종료한다', async () => {
    const calendarService = { getCalendarBySlug: jest.fn() };
    const participantService = {
      getParticipantByUuid: jest
        .fn()
        .mockRejectedValue(Errors.NotFound('참가자를 찾을 수 없습니다')),
    };
    const controller = new CalendarSocketController(
      calendarService as never,
      participantService as never
    );
    const { socket, handlers } = createSocket();
    controller.handleSocketEvent(socket);

    handlers.get('joinCalendarRoom')?.();
    await new Promise((resolve) => setImmediate(resolve));

    expect(socket.join).not.toHaveBeenCalledWith('calendar-slug');
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });

  it('토큰 캘린더와 참가자 소속이 다르면 방 입장을 거부한다', async () => {
    const calendarService = { getCalendarBySlug: jest.fn().mockResolvedValue({ id: 10 }) };
    const participantService = {
      getParticipantByUuid: jest.fn().mockResolvedValue({ calendar_id: 20 }),
    };
    const controller = new CalendarSocketController(
      calendarService as never,
      participantService as never
    );
    const { socket, handlers } = createSocket();
    controller.handleSocketEvent(socket);

    handlers.get('joinCalendarRoom')?.();
    await new Promise((resolve) => setImmediate(resolve));

    expect(socket.join).not.toHaveBeenCalledWith('calendar-slug');
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });
});
