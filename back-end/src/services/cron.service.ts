import cron from 'node-cron';

import { TransactionManager } from '../infrastructure/transaction.manager';
import { logger } from '../middlewares/logger';
import { dateKindMap, SafeDateInfo } from '../models/DateInfo';
import { ICalendarRepository } from '../repositories/calendar.repository';
import { IDateInfoRepository } from '../repositories/dateInfo.repository';
import { IParticipantRepository } from '../repositories/participant.repository';
import { IUserRepository } from '../repositories/user.repository';
import { getIO } from '../sockets';
import { dateKindCodeToDateKind } from '../utils/dateKindCodeChanger';
import { todayDateOnlyKst } from '../utils/dateOnly';
import { getSpcdeInfoUrl } from '../utils/Spcde.api';
import { MailService } from './mail.service';
import { IVoteService } from './vote.service';

export class CronService {
  private holidayUpdateInFlight?: Promise<void>;

  constructor(
    private calendarRepository: ICalendarRepository,
    private dateInfoRepository: IDateInfoRepository,
    private voteService?: IVoteService,
    private userRepository?: IUserRepository,
    private participantRepository?: IParticipantRepository,
    private mailService?: MailService
  ) {}

  public start() {
    cron.schedule(
      '0 0 * * *',
      async ({ date }) => {
        const referenceDate = todayDateOnlyKst(date);
        logger.info('[Cron] 투표 자동 마감 시작 (KST 00:00)');

        await this.runCalendarClosure(referenceDate);

        logger.info('[Cron] 투표 자동 마감 종료');
      },
      { timezone: 'Asia/Seoul' }
    );

    cron.schedule(
      '0 4 * * *',
      async ({ date }) => {
        const referenceDate = todayDateOnlyKst(date);
        const [year, month, day] = referenceDate.split('-').map(Number);
        logger.info('[Cron] 정기 유지보수 시작 (KST 04:00)');

        await this.deleteExpiredCalendars();

        const fullUpdate = month === 12 && day === 1;
        await this.runHolidayUpdate(!fullUpdate, year);

        logger.info('[Cron] 정기 유지보수 종료');
      },
      { timezone: 'Asia/Seoul' }
    );
  }

  private async deleteExpiredCalendars() {
    try {
      const expiredCalendars = await this.calendarRepository.findExpired();

      if (expiredCalendars.length === 0) return;

      logger.info(`[Cron] 보관 기간이 지난 ${expiredCalendars.length}개의 캘린더를 삭제`);

      const expiredCalendarIds = expiredCalendars.map((calendar) => calendar.id);

      const deletedCalendars = await this.calendarRepository.deleteByIds(expiredCalendarIds);

      if (expiredCalendars.length !== deletedCalendars) {
        logger.warn(
          `[Cron] 캘린더 삭제 개수 불일치. (대상: ${expiredCalendars.length}개, 실제 삭제: ${deletedCalendars}개)`
        );
      }

      const io = getIO();

      for (const calendar of expiredCalendars) {
        try {
          io.to(calendar.slug).emit('calendarDeleted', {
            message: '보관 기간(30일)이 만료되어 캘린더가 영구 삭제되었습니다.',
          });
          io.in(calendar.slug).disconnectSockets(true);

          logger.info(`[Cron] 삭제 완료: ${calendar.slug}`);
        } catch (error) {
          logger.error(`[Cron] 삭제 실패: ${calendar.slug}`, error);
        }
      }
    } catch (err) {
      logger.error('[Cron] 삭제 작업 중 오류 발생', err);
    }
  }

  public async runCalendarClosure(
    referenceDate: string = todayDateOnlyKst(),
    emitRealtime = true
  ) {
    try {
      const closedCalendars = await TransactionManager.run(async (connection) => {
        const targetCalendars = await this.calendarRepository.findEndedAndOpenForUpdate(
          connection,
          referenceDate
        );

        if (targetCalendars.length === 0) return [];

        const targetCalendarIds = targetCalendars.map((calendar) => calendar.id);
        const closedCalendarsCount = await this.calendarRepository.closeByIds(
          targetCalendarIds,
          connection
        );

        if (targetCalendars.length !== closedCalendarsCount) {
          throw new Error(
            `[Cron] 캘린더 마감 개수 불일치. (대상: ${targetCalendars.length}개, 실제 마감: ${closedCalendarsCount}개)`
          );
        }

        return targetCalendars;
      });

      if (closedCalendars.length === 0) return;

      logger.info(`[Cron] 투표 기간이 끝난 ${closedCalendars.length}개의 캘린더를 마감`);

      for (const calendar of closedCalendars) {
        if (
          this.voteService &&
          this.userRepository &&
          this.participantRepository &&
          this.mailService
        ) {
          try {
            const [owner, voteStatus, participants] = await Promise.all([
              this.userRepository.findUserInfoById(calendar.owner_id),
              this.voteService.getVoteStatusByCalendar(calendar.id),
              this.participantRepository.findAllByCalendarId(calendar.id),
            ]);

            await this.mailService.sendCalendarClosedEmail({
              to: owner.email,
              calendar,
              voteStatus,
              participantsCount: participants.length,
            });
          } catch (error) {
            // 메일 전송 실패가 캘린더 마감 상태나 실시간 종료 알림에 영향을 주지 않게 분리한다.
            logger.error(`[Cron] 마감 메일 발송 실패: ${calendar.slug}`, error);
          }
        }

        if (!emitRealtime) {
          continue;
        }

        try {
          const io = getIO();
          io.to(calendar.slug).emit('calendarClosed', {
            message: '투표 기간이 종료되어 자동 마감되었습니다.',
            isClosed: true,
          });

          logger.info(`[Cron] 마감 완료: ${calendar.slug}`);
        } catch (error) {
          logger.error(`[Cron] 실시간 마감 알림 실패: ${calendar.slug}`, error);
        }
      }
    } catch (err) {
      logger.error('❌ [Cron] 마감 작업 중 오류 발생', err);
    }
  }

  public runHolidayUpdate(
    onlyMissing = true,
    currentYear = new Date().getUTCFullYear()
  ): Promise<void> {
    if (this.holidayUpdateInFlight) {
      // 연간 전체 갱신 요청은 진행 중인 누락 복구가 끝난 뒤 수행한다.
      return onlyMissing
        ? this.holidayUpdateInFlight
        : this.holidayUpdateInFlight.then(() => this.runHolidayUpdate(false, currentYear));
    }
    this.holidayUpdateInFlight = this.updateDateInfo(onlyMissing, currentYear)
      .then(() => this.deleteExpiredDateInfo(currentYear))
      .finally(() => {
        this.holidayUpdateInFlight = undefined;
      });
    return this.holidayUpdateInFlight;
  }

  private async updateDateInfo(onlyMissing: boolean, currentYear: number) {
    logger.info(`[Cron] ${currentYear}년 기준 공휴일 정보 업데이트 시작`);

    for (let year = currentYear - 3; year <= currentYear + 2; year++) {
      logger.info(`[Cron] ${year}년 업데이트 시작`);
      const syncedDateKinds = onlyMissing
        ? new Set(await this.dateInfoRepository.findSyncedPublicApiDateKindsByYear(year.toString()))
        : new Set();

      for (let dateKindCodeNum = 1; dateKindCodeNum <= dateKindMap.size; dateKindCodeNum++) {
        const dateKind = dateKindCodeToDateKind(dateKindCodeNum);
        const dateKindCode = dateKindMap.get(dateKind);

        if (syncedDateKinds.has(dateKind)) {
          continue;
        }

        try {
          const dateInfoList: SafeDateInfo[] = await getSpcdeInfoUrl(year, dateKind);
          await this.dateInfoRepository.insertDateInfos(dateInfoList);
          await this.dateInfoRepository.markPublicApiDateKindSynced(year.toString(), dateKind);
          logger.info(`[Cron] ${year}년 ${dateKindCode} 업데이트 완료: ${dateInfoList.length}건`);
        } catch (err) {
          logger.error(`[Cron] ${year}년 ${dateKindCode} 업데이트 실패`, err);
        }
      }
    }

    logger.info(`[Cron] 공휴일 정보 업데이트 종료`);
  }

  private async deleteExpiredDateInfo(currentYear: number) {
    const expirationYear = currentYear - 3;

    try {
      logger.info(`[Cron] ${currentYear}년 기준 만료된 년도 date-info 정리 시작`);

      const deletedCount = await this.dateInfoRepository.deleteByYearBefore(
        expirationYear.toString()
      );
      await this.dateInfoRepository.deleteSyncStatusByYearBefore(expirationYear.toString());

      logger.info(`[Cron] ${expirationYear}년 date-info 삭제 완료: ${deletedCount}개`);

      const remainingData = await this.dateInfoRepository.findByYearBefore(
        expirationYear.toString()
      );

      logger.info(`[Cron] ${expirationYear}년 이후 date-info 남은 개수: ${remainingData.length}개`);

      if (remainingData.length > 0) {
        logger.warn(
          `[Cron] 만료된 년도 date-info 정리 후에도 ${expirationYear}년 이전 데이터가 ${remainingData.length}개 남아있습니다.`
        );
      }
    } catch (err) {
      logger.error(`[Cron] 만료된 년도 date-info 정리 중 오류 발생`, err);
    }
  }
}
