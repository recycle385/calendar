import { logger } from '../middlewares/logger';
import { ICalendarService } from '../services/calendar.service';
import { IParticipantService } from '../services/participant.service';
import { CustomSocket } from '../types/socket.types';

export class CalendarSocketController {
  constructor(
    private calendarService: ICalendarService,
    private participantService: IParticipantService
  ) {}

  public handleSocketEvent(socket: CustomSocket) {
    socket.on('joinCalendarRoom', () => {
      // [디버깅] 이벤트 수신 확인용 로그 (필수!)
      logger.debug(`joinCalendarRoom 이벤트 수신: Socket ID ${socket.id}`);
      void this.joinCalendarRoom(socket).catch((err) => {
        logger.error('joinCalendarRoom 핸들러 에러', { error: err });
        socket.emit('error', { message: 'Internal Server Error during Join' });
      });
    });

    socket.on('leaveCalendarRoom', () => {
      try {
        this.handleLeave(socket);
        logger.info(
          `유저 ${socket.data.sub}님이 캘린더 방 ${socket.data.calendarSlug}에서 나갔습니다.`
        );
      } catch (err) {
        logger.error('leaveCalendarRoom 에러', { error: err });
      }
    });

    socket.on('disconnecting', () => {
      try {
        this.handleLeave(socket);
      } catch (err) {
        logger.error('disconnecting 에러', { error: err });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`유저 ${socket.data.sub}님이 연결을 종료했습니다.`);
    });

    socket.on('error', (err: Error) => {
      logger.error('소켓 에러 발생', { error: err });
    });
  }

  private async joinCalendarRoom(socket: CustomSocket) {
    try {
      const calendarSlug = socket.data.calendarSlug || socket.data.calendarId;

      const { nickname, sub, role } = socket.data;

      if (!calendarSlug) {
        logger.error(`방 입장 실패: calendarSlug가 없습니다. User: ${sub}`);
        socket.emit('error', { message: 'Calendar ID is missing in socket data' });
        return;
      }

      const expiresAt = socket.data.exp;
      if (!expiresAt || expiresAt <= Math.floor(Date.now() / 1000)) {
        socket.emit('error', { message: '참가자 인증이 만료되었습니다' });
        socket.disconnect(true);
        return;
      }

      const [participant, calendar] = await Promise.all([
        this.participantService.getParticipantByUuid(sub),
        this.calendarService.getCalendarBySlug(calendarSlug),
      ]);
      if (participant.calendar_id !== calendar.id) {
        socket.emit('error', { message: '캘린더 참가 자격을 확인할 수 없습니다' });
        socket.disconnect(true);
        return;
      }

      // [디버깅] 실제 입장 시도 로그
      logger.debug(`입장 시도 - ID: ${sub}, Room: ${calendarSlug}`);

      if (socket.rooms.has(calendarSlug)) {
        logger.debug(`이미 방에 존재함: ${calendarSlug}`);
        return;
      }

      await socket.join(calendarSlug);

      logger.info(`아이디: ${sub}가 캘린더 방: ${calendarSlug} 입장 성공`);

      socket.to(calendarSlug).emit('userOnline', { sub, nickname, role });

      const sockets = await socket.nsp.in(calendarSlug).fetchSockets();

      const onlineUsers = sockets
        .map((s) => {
          const data = (s as unknown as CustomSocket).data;
          return { sub: data.sub, nickname: data.nickname, role: data.role };
        })
        .filter((user, index, users) => users.findIndex((item) => item.sub === user.sub) === index);

      socket.emit('onlineUsers', onlineUsers);
    } catch (err) {
      logger.error('joinCalendarRoom 내부 로직 에러', { error: err });
      socket.emit('error', { message: '캘린더 참가 자격을 확인할 수 없습니다' });
      socket.disconnect(true);
    }
  }

  private handleLeave(socket: CustomSocket) {
    try {
      const calendarSlug = socket.data.calendarSlug || socket.data.calendarId;
      const { nickname, sub } = socket.data;

      if (calendarSlug && socket.rooms.has(calendarSlug)) {
        socket.leave(calendarSlug);

        socket.to(calendarSlug).emit('userOffline', { sub, nickname });

        logger.info(`아이디: ${sub}가 캘린더 방: ${calendarSlug} 퇴장`);
      }
    } catch (err) {
      logger.error('handleLeave 에러', { error: err });
    }
  }
}
