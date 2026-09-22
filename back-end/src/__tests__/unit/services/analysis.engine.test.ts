import { AnalysisPlan, AnalysisSnapshot } from '../../../models/Analysis';
import { executeAnalysisPlan, validateAnalysisPlanDomain } from '../../../services/analysis.engine';

const snapshot: AnalysisSnapshot = {
  participants: [
    { id: 1, alias: 'PERSON_1', nickname: '민수' },
    { id: 2, alias: 'PERSON_2', nickname: '철수' },
    { id: 3, alias: 'PERSON_3', nickname: '영희' },
  ],
  dates: [
    {
      id: 11,
      date: '2026-09-26',
      isEnabled: true,
      votes: new Map([
        [1, 'available'],
        [2, 'available'],
        [3, 'maybe'],
      ]),
    },
    {
      id: 12,
      date: '2026-09-27',
      isEnabled: true,
      votes: new Map([
        [1, 'unavailable'],
        [2, 'available'],
      ]),
    },
  ],
};

function basePlan(): AnalysisPlan {
  return {
    status: 'ok',
    reason: null,
    target: 'dates',
    participantScope: { include: [], exclude: [] },
    dateScope: { dates: [], weekdays: [], from: null, to: null },
    conditions: [],
    conditionLogic: 'all',
    output: {
      kind: 'list',
      metric: null,
      direction: null,
      limit: null,
      position: null,
      includeTies: true,
    },
  };
}

describe('analysis.engine', () => {
  it('두 참가자가 모두 가능한 날짜를 찾는다', () => {
    const plan = basePlan();
    plan.conditions = [
      {
        type: 'participant_status',
        ref: 'PERSON_1',
        statuses: ['available'],
        negate: false,
        operator: null,
        value: null,
        denominator: null,
      },
      {
        type: 'participant_status',
        ref: 'PERSON_2',
        statuses: ['available'],
        negate: false,
        operator: null,
        value: null,
        denominator: null,
      },
    ];

    validateAnalysisPlanDomain(plan, snapshot);
    const result = executeAnalysisPlan(plan, snapshot);
    expect(result.dates?.map((item) => item.date)).toEqual(['2026-09-26']);
  });

  it('미투표를 불가능과 구분한다', () => {
    const plan = basePlan();
    plan.target = 'participants';
    plan.dateScope.dates = ['2026-09-27'];
    plan.conditions = [
      {
        type: 'date_status',
        ref: '2026-09-27',
        statuses: ['no_vote'],
        negate: false,
        operator: null,
        value: null,
        denominator: null,
      },
    ];

    validateAnalysisPlanDomain(plan, snapshot);
    const result = executeAnalysisPlan(plan, snapshot);
    expect(result.participants?.map((item) => item.alias)).toEqual(['PERSON_3']);
  });

  it('참가자 제외 후 날짜별 가능 인원을 다시 계산한다', () => {
    const plan = basePlan();
    plan.participantScope.exclude = ['PERSON_1'];
    plan.output = {
      kind: 'rank',
      metric: 'available',
      direction: 'max',
      limit: 1,
      position: null,
      includeTies: true,
    };

    validateAnalysisPlanDomain(plan, snapshot);
    const result = executeAnalysisPlan(plan, snapshot);
    expect(result.dates?.map((item) => item.date)).toEqual(['2026-09-26', '2026-09-27']);
    expect(result.dates?.[0].counts.available).toBe(1);
  });

  it('주말 필터를 적용한다', () => {
    const plan = basePlan();
    plan.dateScope.weekdays = [0];

    validateAnalysisPlanDomain(plan, snapshot);
    const result = executeAnalysisPlan(plan, snapshot);
    expect(result.dates?.map((item) => item.date)).toEqual(['2026-09-27']);
  });

  it('응답자 기준 비율 조건을 서버에서 계산한다', () => {
    const plan = basePlan();
    plan.conditions = [
      {
        type: 'ratio',
        ref: null,
        statuses: ['available'],
        negate: false,
        operator: 'gte',
        value: 60,
        denominator: 'responded',
      },
    ];

    validateAnalysisPlanDomain(plan, snapshot);
    const result = executeAnalysisPlan(plan, snapshot);
    expect(result.dates?.map((item) => item.date)).toEqual(['2026-09-26']);
  });

  it('날짜 비교는 지정된 후보 안에서 상태 수를 계산한다', () => {
    const plan = basePlan();
    plan.dateScope.dates = ['2026-09-26', '2026-09-27'];
    plan.output = {
      kind: 'compare',
      metric: 'available',
      direction: 'max',
      limit: null,
      position: null,
      includeTies: true,
    };

    validateAnalysisPlanDomain(plan, snapshot);
    const result = executeAnalysisPlan(plan, snapshot);
    expect(result.dates).toHaveLength(2);
    expect(result.dates?.every((item) => item.counts.available >= 1)).toBe(true);
  });

  it('현재 캘린더에 없는 참가자 별칭은 실행 전에 거부한다', () => {
    const plan = basePlan();
    plan.participantScope.exclude = ['PERSON_999'];
    expect(() => validateAnalysisPlanDomain(plan, snapshot)).toThrow();
  });

  it('포함과 제외가 충돌하는 참가자 조건은 거부한다', () => {
    const plan = basePlan();
    plan.participantScope.include = ['PERSON_1'];
    plan.participantScope.exclude = ['PERSON_1'];
    expect(() => validateAnalysisPlanDomain(plan, snapshot)).toThrow();
  });
});
