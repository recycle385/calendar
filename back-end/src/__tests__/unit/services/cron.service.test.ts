import cron from 'node-cron';

import { TransactionManager } from '../../../infrastructure/transaction.manager';
import { VALID_DATE_KINDS } from '../../../models/DateInfo';
import { ICalendarRepository } from '../../../repositories/calendar.repository';
import { IDateInfoRepository } from '../../../repositories/dateInfo.repository';
import { CronService } from '../../../services/cron.service';
import { getSpcdeInfoUrl } from '../../../utils/Spcde.api';

jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../../../middlewares/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('../../../utils/Spcde.api', () => ({ getSpcdeInfoUrl: jest.fn() }));
jest.mock('../../../infrastructure/transaction.manager', () => ({
  TransactionManager: { run: jest.fn() },
}));
jest.mock('../../../sockets', () => ({ getIO: jest.fn() }));

const api = getSpcdeInfoUrl as jest.Mock;

function getScheduledJob(expression: string) {
  const scheduled = (cron.schedule as jest.Mock).mock.calls.find(
    ([scheduledExpression]) => scheduledExpression === expression
  );

  if (!scheduled) throw new Error(`예약 작업을 찾을 수 없습니다: ${expression}`);
  return scheduled[1] as ({ date }: { date: Date }) => Promise<void>;
}

describe('공휴일 동기화 복구', () => {
  let service: CronService;
  const repository = {
    findSyncedPublicApiDateKindsByYear: jest.fn(),
    markPublicApiDateKindSynced: jest.fn(),
    insertDateInfos: jest.fn(),
    deleteByYearBefore: jest.fn(),
    deleteSyncStatusByYearBefore: jest.fn(),
    findByYearBefore: jest.fn(),
  };
  const year = new Date().getUTCFullYear();
  const calendars = {
    findExpired: jest.fn(),
    findEndedAndOpenForUpdate: jest.fn(),
    closeByIds: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    repository.findSyncedPublicApiDateKindsByYear.mockResolvedValue(VALID_DATE_KINDS);
    repository.insertDateInfos.mockResolvedValue(0);
    repository.deleteByYearBefore.mockResolvedValue(0);
    repository.findByYearBefore.mockResolvedValue([]);
    api.mockResolvedValue([]);
    calendars.findExpired.mockResolvedValue([]);
    calendars.findEndedAndOpenForUpdate.mockResolvedValue([]);
    calendars.closeByIds.mockResolvedValue(0);
    (TransactionManager.run as jest.Mock).mockImplementation(
      (callback: (connection: object) => unknown) => callback({ transaction: true })
    );
    service = new CronService(
      calendars as unknown as ICalendarRepository,
      repository as unknown as IDateInfoRepository
    );
  });

  it('올해가 완료돼도 내년의 누락 종류를 찾아 복구한다', async () => {
    repository.findSyncedPublicApiDateKindsByYear.mockImplementation(async (value) =>
      value === String(year + 1)
        ? VALID_DATE_KINDS.filter((kind) => kind !== '03')
        : VALID_DATE_KINDS
    );
    await service.runHolidayUpdate();
    expect(api).toHaveBeenCalledTimes(1);
    expect(api).toHaveBeenCalledWith(year + 1, '03');
    expect(repository.markPublicApiDateKindSynced).toHaveBeenCalledWith(String(year + 1), '03');
    expect(repository.findSyncedPublicApiDateKindsByYear).toHaveBeenCalledTimes(6);
  });

  it('모든 연도가 완료되면 API를 생략하되 만료 데이터와 상태는 정리한다', async () => {
    await service.runHolidayUpdate();
    expect(api).not.toHaveBeenCalled();
    expect(repository.deleteSyncStatusByYearBefore).toHaveBeenCalledWith(String(year - 3));
  });

  it('실패한 종류는 완료로 기록하지 않고 다음 실행에서 다시 시도한다', async () => {
    repository.findSyncedPublicApiDateKindsByYear.mockImplementation(async (value) =>
      value === String(year + 2)
        ? VALID_DATE_KINDS.filter((kind) => kind !== '01')
        : VALID_DATE_KINDS
    );
    api.mockRejectedValueOnce(new Error('temporary failure')).mockResolvedValue([]);
    await service.runHolidayUpdate();
    expect(repository.markPublicApiDateKindSynced).not.toHaveBeenCalled();
    await service.runHolidayUpdate();
    expect(api).toHaveBeenCalledTimes(2);
    expect(repository.markPublicApiDateKindSynced).toHaveBeenCalledWith(String(year + 2), '01');
  });

  it('겹치는 누락 복구 실행은 한 번만 수행한다', async () => {
    repository.findSyncedPublicApiDateKindsByYear.mockResolvedValue([]);
    await Promise.all([service.runHolidayUpdate(), service.runHolidayUpdate()]);
    expect(api).toHaveBeenCalledTimes(6 * VALID_DATE_KINDS.length);
  });

  it('오전 4시 유지보수 작업에서도 공휴일 누락 복구를 실행한다', async () => {
    const run = jest.spyOn(service, 'runHolidayUpdate').mockResolvedValue();
    service.start();
    const schedule = cron.schedule as jest.Mock;
    expect(schedule).toHaveBeenCalledWith('0 4 * * *', expect.any(Function), {
      timezone: 'Asia/Seoul',
    });
    await getScheduledJob('0 4 * * *')({ date: new Date('2026-09-08T19:00:00Z') });
    expect(run).toHaveBeenCalledWith(true, 2026);
  });

  it.each([
    ['2026-09-08T15:00:00Z', '2026-09-09'],
    ['2026-09-30T15:00:00Z', '2026-10-01'],
    ['2026-12-31T15:00:00Z', '2027-01-01'],
    ['2028-02-29T15:00:00Z', '2028-03-01'],
  ])('한국 자정인 UTC %s 실행은 %s 이전 종료분을 마감한다', async (scheduledAt, cutoff) => {
    service.start();
    await getScheduledJob('0 0 * * *')({ date: new Date(scheduledAt) });
    expect(calendars.findEndedAndOpenForUpdate).toHaveBeenCalledWith(expect.anything(), cutoff);
    expect(calendars.findExpired).not.toHaveBeenCalled();
  });

  it('오전 4시 유지보수는 캘린더 삭제를 실행하지만 자동 마감은 실행하지 않는다', async () => {
    jest.spyOn(service, 'runHolidayUpdate').mockResolvedValue();
    service.start();

    await getScheduledJob('0 4 * * *')({ date: new Date('2026-09-08T19:00:00Z') });

    expect(calendars.findExpired).toHaveBeenCalledWith();
    expect(calendars.findEndedAndOpenForUpdate).not.toHaveBeenCalled();
  });

  it.each([
    ['2026-11-30T19:00:00Z', false, 2026],
    ['2026-12-01T19:00:00Z', true, 2026],
    ['2026-12-31T19:00:00Z', true, 2027],
  ])(
    'UTC %s의 공휴일 갱신은 한국 기준 날짜와 연도를 사용한다',
    async (scheduledAt, onlyMissing, targetYear) => {
      const run = jest.spyOn(service, 'runHolidayUpdate').mockResolvedValue();
      service.start();
      await getScheduledJob('0 4 * * *')({ date: new Date(scheduledAt) });
      expect(run).toHaveBeenCalledWith(onlyMissing, targetYear);
    }
  );

  it('새해 첫 크론은 새 연도를 기준으로 수집 범위와 정리 범위를 맞춘다', async () => {
    service.start();
    await getScheduledJob('0 4 * * *')({ date: new Date('2026-12-31T19:00:00Z') });
    expect(
      repository.findSyncedPublicApiDateKindsByYear.mock.calls.map(([value]) => value)
    ).toEqual(['2024', '2025', '2026', '2027', '2028', '2029']);
    expect(repository.deleteSyncStatusByYearBefore).toHaveBeenCalledWith('2024');
    expect(repository.deleteByYearBefore).toHaveBeenCalledWith('2024');
  });

  it('전체 갱신은 이미 완료된 종류도 다시 가져온다', async () => {
    await service.runHolidayUpdate(false);
    expect(api).toHaveBeenCalledTimes(6 * VALID_DATE_KINDS.length);
  });

  it('잠금을 얻기 전에 종료일이 연장되면 자동 마감하지 않는다', async () => {
    calendars.findEndedAndOpenForUpdate.mockResolvedValue([]);
    service.start();

    await getScheduledJob('0 0 * * *')({ date: new Date('2026-09-08T15:00:00Z') });

    expect(calendars.findEndedAndOpenForUpdate).toHaveBeenCalledWith(
      expect.anything(),
      '2026-09-09'
    );
    expect(calendars.closeByIds).not.toHaveBeenCalled();
  });

  it('서버 시작 복구는 누락 마감을 처리하되 실시간 알림을 보내지 않는다', async () => {
    const calendar = { id: 1, slug: 'ended-calendar' };
    calendars.findEndedAndOpenForUpdate.mockResolvedValue([calendar]);
    calendars.closeByIds.mockResolvedValue(1);

    await service.runCalendarClosure('2026-09-09', false);

    expect(calendars.findEndedAndOpenForUpdate).toHaveBeenCalledWith(
      expect.anything(),
      '2026-09-09'
    );
    expect(calendars.closeByIds).toHaveBeenCalledWith([1], expect.anything());
  });
});
