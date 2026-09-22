import {
  AnalysisCondition,
  AnalysisDateResult,
  AnalysisExecutionResult,
  AnalysisOutput,
  AnalysisParticipantResult,
  AnalysisPlan,
  AnalysisSnapshot,
  AnalysisSnapshotDate,
  AnalysisSnapshotParticipant,
  AnalysisVoteStatus,
} from '../models/Analysis';
import { compareDateOnly, normalizeDateOnly } from '../utils/dateOnly';

function statusFor(
  date: AnalysisSnapshotDate,
  participantId: number
): Exclude<AnalysisVoteStatus, 'responded'> {
  return date.votes.get(participantId) ?? 'no_vote';
}

function matchesStatus(actual: Exclude<AnalysisVoteStatus, 'responded'>, expected: AnalysisVoteStatus[]) {
  return expected.some((item) => (item === 'responded' ? actual !== 'no_vote' : item === actual));
}

function applyOperator(left: number, operator: NonNullable<AnalysisCondition['operator']>, right: number) {
  switch (operator) {
    case 'eq':
      return left === right;
    case 'gt':
      return left > right;
    case 'gte':
      return left >= right;
    case 'lt':
      return left < right;
    case 'lte':
      return left <= right;
  }
}

function getWeekday(date: string): number {
  const normalized = normalizeDateOnly(date);
  const [year, month, day] = normalized.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function resolveParticipantScope(snapshot: AnalysisSnapshot, plan: AnalysisPlan): AnalysisSnapshotParticipant[] {
  const byAlias = new Map(snapshot.participants.map((item) => [item.alias, item]));
  const include = unique(plan.participantScope.include);
  const exclude = new Set(unique(plan.participantScope.exclude));

  let scoped = include.length
    ? include.map((alias) => byAlias.get(alias)).filter((item): item is AnalysisSnapshotParticipant => Boolean(item))
    : [...snapshot.participants];

  scoped = scoped.filter((item) => !exclude.has(item.alias));
  return scoped;
}

function resolveDateScope(snapshot: AnalysisSnapshot, plan: AnalysisPlan): AnalysisSnapshotDate[] {
  const exact = new Set(plan.dateScope.dates);
  const weekdays = new Set(plan.dateScope.weekdays);
  return snapshot.dates.filter((date) => {
    if (!date.isEnabled) return false;
    if (exact.size > 0 && !exact.has(date.date)) return false;
    if (plan.dateScope.from && compareDateOnly(date.date, plan.dateScope.from) < 0) return false;
    if (plan.dateScope.to && compareDateOnly(date.date, plan.dateScope.to) > 0) return false;
    if (weekdays.size > 0 && !weekdays.has(getWeekday(date.date))) return false;
    return true;
  });
}

function countsForDate(date: AnalysisSnapshotDate, participants: AnalysisSnapshotParticipant[]) {
  const counts = {
    available: 0,
    maybe: 0,
    unavailable: 0,
    no_vote: 0,
    responded: 0,
  };

  for (const participant of participants) {
    const status = statusFor(date, participant.id);
    counts[status] += 1;
    if (status !== 'no_vote') counts.responded += 1;
  }

  return counts;
}

function countsForParticipant(participant: AnalysisSnapshotParticipant, dates: AnalysisSnapshotDate[]) {
  const counts = {
    available: 0,
    maybe: 0,
    unavailable: 0,
    no_vote: 0,
    responded: 0,
  };

  for (const date of dates) {
    const status = statusFor(date, participant.id);
    counts[status] += 1;
    if (status !== 'no_vote') counts.responded += 1;
  }

  return counts;
}

function conditionOnDate(
  condition: AnalysisCondition,
  date: AnalysisSnapshotDate,
  participants: AnalysisSnapshotParticipant[],
  participantByAlias: Map<string, AnalysisSnapshotParticipant>
): boolean {
  let matched = false;

  if (condition.type === 'participant_status') {
    const participant = condition.ref ? participantByAlias.get(condition.ref) : undefined;
    if (!participant) return false;
    matched = matchesStatus(statusFor(date, participant.id), condition.statuses);
  } else if (condition.type === 'count') {
    if (!condition.operator || condition.value === null) return false;
    const counts = countsForDate(date, participants);
    const value = unique(condition.statuses).reduce((sum, status) => sum + counts[status], 0);
    matched = applyOperator(value, condition.operator, condition.value);
  } else if (condition.type === 'ratio') {
    if (!condition.operator || condition.value === null) return false;
    const counts = countsForDate(date, participants);
    const numerator = unique(condition.statuses).reduce((sum, status) => sum + counts[status], 0);
    const denominator = condition.denominator === 'responded' ? counts.responded : participants.length;
    if (denominator <= 0) return false;
    matched = applyOperator((numerator / denominator) * 100, condition.operator, condition.value);
  } else {
    return false;
  }

  return condition.negate ? !matched : matched;
}

function conditionOnParticipant(
  condition: AnalysisCondition,
  participant: AnalysisSnapshotParticipant,
  dates: AnalysisSnapshotDate[],
  dateByValue: Map<string, AnalysisSnapshotDate>
): boolean {
  let matched = false;

  if (condition.type === 'date_status') {
    const date = condition.ref ? dateByValue.get(condition.ref) : undefined;
    if (!date) return false;
    matched = matchesStatus(statusFor(date, participant.id), condition.statuses);
  } else if (condition.type === 'count') {
    if (!condition.operator || condition.value === null) return false;
    const counts = countsForParticipant(participant, dates);
    const value = unique(condition.statuses).reduce((sum, status) => sum + counts[status], 0);
    matched = applyOperator(value, condition.operator, condition.value);
  } else if (condition.type === 'ratio') {
    if (!condition.operator || condition.value === null) return false;
    const counts = countsForParticipant(participant, dates);
    const numerator = unique(condition.statuses).reduce((sum, status) => sum + counts[status], 0);
    const denominator = condition.denominator === 'responded' ? counts.responded : dates.length;
    if (denominator <= 0) return false;
    matched = applyOperator((numerator / denominator) * 100, condition.operator, condition.value);
  } else {
    return false;
  }

  return condition.negate ? !matched : matched;
}

function matchConditions(values: boolean[], logic: AnalysisPlan['conditionLogic']) {
  if (values.length === 0) return true;
  return logic === 'all' ? values.every(Boolean) : values.some(Boolean);
}

function metricValue(
  item: AnalysisDateResult | AnalysisParticipantResult,
  metric: NonNullable<Exclude<AnalysisOutput['metric'], 'default_rank'>>
) {
  return item.counts[metric];
}

function sortDates(
  rows: AnalysisDateResult[],
  output: AnalysisOutput
): AnalysisDateResult[] {
  const metric = output.metric ?? 'default_rank';
  const direction = output.direction ?? 'max';

  return [...rows].sort((left, right) => {
    if (metric === 'default_rank') {
      const availableDiff = right.counts.available - left.counts.available;
      if (availableDiff !== 0) return availableDiff;
      const maybeDiff = right.counts.maybe - left.counts.maybe;
      if (maybeDiff !== 0) return maybeDiff;
      return left.date.localeCompare(right.date);
    }

    const diff = metricValue(left, metric) - metricValue(right, metric);
    if (diff !== 0) return direction === 'min' ? diff : -diff;
    return left.date.localeCompare(right.date);
  });
}

function sortParticipants(
  rows: AnalysisParticipantResult[],
  output: AnalysisOutput
): AnalysisParticipantResult[] {
  const metric = output.metric && output.metric !== 'default_rank' ? output.metric : 'available';
  const direction = output.direction ?? 'max';
  return [...rows].sort((left, right) => {
    const diff = metricValue(left, metric) - metricValue(right, metric);
    if (diff !== 0) return direction === 'min' ? diff : -diff;
    return left.alias.localeCompare(right.alias);
  });
}

function selectWithTies<T extends AnalysisDateResult | AnalysisParticipantResult>(
  rows: T[],
  output: AnalysisOutput
): { rows: T[]; selected: T | null; ties: T[] } {
  if (rows.length === 0) return { rows, selected: null, ties: [] };

  if (output.position && rows[0]?.type === 'date') {
    const sorted = [...(rows as AnalysisDateResult[])].sort((a, b) => a.date.localeCompare(b.date));
    const selected = (output.position === 'earliest' ? sorted[0] : sorted[sorted.length - 1]) as T;
    return { rows: [selected], selected, ties: [] };
  }

  const limit = output.limit ?? (output.kind === 'rank' ? 5 : rows.length);
  const limited = rows.slice(0, limit);
  const selected = limited[0] ?? null;

  if (!output.includeTies || !selected || !output.metric || output.metric === 'default_rank') {
    return { rows: limited, selected, ties: [] };
  }

  const metric = output.metric;
  const boundary = limited[limited.length - 1];
  if (!boundary) return { rows: limited, selected, ties: [] };
  const boundaryValue = metricValue(boundary, metric);
  const expanded = rows.filter((item, index) => index < limit || metricValue(item, metric) === boundaryValue);
  const selectedValue = metricValue(selected, metric);
  const topTies = rows.filter((item) => metricValue(item, metric) === selectedValue);
  return { rows: expanded, selected, ties: topTies.length > 1 ? topTies : [] };
}

export function validateAnalysisPlanDomain(plan: AnalysisPlan, snapshot: AnalysisSnapshot): void {
  if (plan.status !== 'ok') return;
  if (!plan.target || !plan.output.kind) throw new Error('분석 대상 또는 출력 형식이 없습니다');

  const participantAliases = new Set(snapshot.participants.map((item) => item.alias));
  const exactDates = new Set(snapshot.dates.filter((item) => item.isEnabled).map((item) => item.date));

  for (const alias of [...plan.participantScope.include, ...plan.participantScope.exclude]) {
    if (!participantAliases.has(alias)) throw new Error(`현재 캘린더에 없는 참가자 참조입니다: ${alias}`);
  }

  const overlap = plan.participantScope.include.filter((alias) => plan.participantScope.exclude.includes(alias));
  if (overlap.length > 0) throw new Error(`동시에 포함/제외된 참가자가 있습니다: ${overlap.join(', ')}`);

  for (const date of plan.dateScope.dates) {
    normalizeDateOnly(date);
    if (!exactDates.has(date)) throw new Error(`현재 캘린더의 활성 후보 날짜가 아닙니다: ${date}`);
  }
  if (plan.dateScope.from) normalizeDateOnly(plan.dateScope.from);
  if (plan.dateScope.to) normalizeDateOnly(plan.dateScope.to);
  if (plan.dateScope.from && plan.dateScope.to && compareDateOnly(plan.dateScope.from, plan.dateScope.to) > 0) {
    throw new Error('날짜 범위의 시작일이 종료일보다 늦습니다');
  }

  for (const condition of plan.conditions) {
    if (condition.statuses.includes('responded') && condition.statuses.length > 1) {
      throw new Error('responded 상태는 다른 상태와 함께 사용할 수 없습니다');
    }
    if (condition.type === 'participant_status') {
      if (plan.target !== 'dates') throw new Error('participant_status 조건은 날짜 탐색에서만 사용할 수 있습니다');
      if (!condition.ref || !participantAliases.has(condition.ref)) throw new Error('유효하지 않은 참가자 조건입니다');
    }
    if (condition.type === 'date_status') {
      if (plan.target !== 'participants') throw new Error('date_status 조건은 참가자 탐색에서만 사용할 수 있습니다');
      if (!condition.ref || !exactDates.has(condition.ref)) throw new Error('유효하지 않은 날짜 조건입니다');
    }
    if (condition.type === 'count' || condition.type === 'ratio') {
      if (!condition.operator || condition.value === null) throw new Error('집계 조건에 비교 연산자와 값이 필요합니다');
    }
    if (condition.type === 'ratio' && (condition.value! < 0 || condition.value! > 100)) {
      throw new Error('비율 조건은 0~100 범위여야 합니다');
    }
  }

  if (plan.output.kind === 'compare' && plan.target !== 'dates') {
    throw new Error('날짜 비교만 지원합니다');
  }
  if (plan.output.kind === 'compare' && plan.dateScope.dates.length < 2) {
    throw new Error('비교할 날짜가 2개 이상 필요합니다');
  }

  if (plan.output.kind === 'ratio') {
    if (plan.target !== 'participants' || plan.output.metric !== 'responded') {
      throw new Error('현재 전체 비율 출력은 투표 참여율만 지원합니다');
    }
    if (plan.conditions.length > 0) {
      throw new Error('투표 참여율 출력에는 별도 조건을 사용할 수 없습니다');
    }
  }
}

export function executeAnalysisPlan(plan: AnalysisPlan, snapshot: AnalysisSnapshot): AnalysisExecutionResult {
  if (plan.status !== 'ok' || !plan.target || !plan.output.kind) {
    throw new Error('실행할 수 없는 분석 계획입니다');
  }

  const participants = resolveParticipantScope(snapshot, plan);
  const dates = resolveDateScope(snapshot, plan);
  const participantByAlias = new Map(snapshot.participants.map((item) => [item.alias, item]));
  const dateByValue = new Map(snapshot.dates.map((item) => [item.date, item]));

  if (plan.target === 'dates') {
    let rows: AnalysisDateResult[] = dates
      .filter((date) =>
        matchConditions(
          plan.conditions.map((condition) => conditionOnDate(condition, date, participants, participantByAlias)),
          plan.conditionLogic
        )
      )
      .map((date) => ({ type: 'date' as const, date: date.date, counts: countsForDate(date, participants) }));

    if (plan.output.kind === 'rank' || plan.output.kind === 'compare') rows = sortDates(rows, plan.output);
    if (plan.output.kind === 'list' && plan.output.position) {
      rows = sortDates(rows, { ...plan.output, metric: 'default_rank' });
    }

    const selection = selectWithTies(rows, plan.output);
    const outputRows = plan.output.kind === 'count' ? [] : selection.rows;

    return {
      target: 'dates',
      kind: plan.output.kind,
      totalMatched: rows.length,
      dates: outputRows,
      selected: plan.output.kind === 'count' ? null : selection.selected,
      ties: plan.output.kind === 'count' ? [] : selection.ties,
    };
  }

  let rows: AnalysisParticipantResult[] = participants
    .filter((participant) =>
      matchConditions(
        plan.conditions.map((condition) => conditionOnParticipant(condition, participant, dates, dateByValue)),
        plan.conditionLogic
      )
    )
    .map((participant) => ({
      type: 'participant' as const,
      alias: participant.alias,
      counts: countsForParticipant(participant, dates),
    }));

  if (plan.output.kind === 'ratio' && plan.output.metric === 'responded') {
    const denominator = rows.length;
    const numerator = rows.filter((participant) => participant.counts.responded > 0).length;
    const percent = denominator === 0 ? 0 : (numerator / denominator) * 100;

    return {
      target: 'participants',
      kind: 'ratio',
      totalMatched: denominator,
      participants: rows,
      selected: null,
      ties: [],
      ratio: {
        metric: 'responded',
        numerator,
        denominator,
        percent,
      },
    };
  }

  if (plan.output.kind === 'rank') rows = sortParticipants(rows, plan.output);
  const selection = selectWithTies(rows, plan.output);

  return {
    target: 'participants',
    kind: plan.output.kind,
    totalMatched: rows.length,
    participants: plan.output.kind === 'count' ? [] : selection.rows,
    selected: plan.output.kind === 'count' ? null : selection.selected,
    ties: plan.output.kind === 'count' ? [] : selection.ties,
  };
}
