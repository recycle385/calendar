import { logger } from '../middlewares/logger';
import {
  AnalysisAnswerResponse,
  AnalysisCondition,
  AnalysisExecutionResult,
  AnalysisPlan,
  AnalysisSnapshot,
  AnalysisSnapshotParticipant,
} from '../models/Analysis';
import { todayDateOnlyKst } from '../utils/dateOnly';
import { Errors } from '../utils/errors';
import { executeAnalysisPlan, validateAnalysisPlanDomain } from './analysis.engine';
import { AnalysisLlmService } from './analysis.llm';
import { ICalendarService } from './calendar.service';
import { IParticipantService } from './participant.service';
import { IVoteService } from './vote.service';

function replaceAllLiteral(value: string, search: string, replacement: string): string {
  if (!search) return value;
  return value.split(search).join(replacement);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceNicknameReference(value: string, nickname: string, alias: string): string {
  if (!nickname) return value;
  const escaped = escapeRegExp(nickname);
  const particles =
    '님(?:은|는|이|가|을|를|과|와|도|만|의|랑|이랑|에게|한테|께서|부터|까지|에서|으로|로)?|은요|는요|은|는|이|가|을|를|과|와|도|만|의|랑|이랑|에게|한테|께서|부터|까지|에서|으로|로';
  const pattern = new RegExp(
    `(^|[^가-힣A-Za-z0-9_])${escaped}(?=$|[^가-힣A-Za-z0-9_]|(?:${particles})(?=$|[^가-힣A-Za-z0-9_]))`,
    'gu'
  );
  return value.replace(pattern, (_match, prefix: string) => `${prefix}${alias}`);
}

function buildAnalysisParticipants(
  participants: Array<{ id: number; nickname: string }>,
  question: string
): AnalysisSnapshotParticipant[] {
  let prefix = '__MOIM_AI_PERSON_';
  const reservedTexts = [question, ...participants.map((participant) => participant.nickname)];
  while (reservedTexts.some((value) => value.includes(prefix))) {
    prefix = `_${prefix}`;
  }

  return participants.map((participant, index) => ({
    id: participant.id,
    alias: `${prefix}${index + 1}__`,
    nickname: participant.nickname,
  }));
}

function pseudonymizeQuestion(
  question: string,
  participants: AnalysisSnapshotParticipant[]
): string {
  return [...participants]
    .sort((a, b) => b.nickname.length - a.nickname.length)
    .reduce(
      (text, participant) =>
        replaceNicknameReference(text, participant.nickname, participant.alias),
      question
    );
}

function restoreAliases(value: string, participants: AnalysisSnapshotParticipant[]): string {
  return [...participants]
    .sort((a, b) => b.alias.length - a.alias.length)
    .reduce((text, participant) => {
      const withHonorific = participant.nickname.endsWith('님')
        ? participant.nickname
        : `${participant.nickname}님`;
      const restoredHonorific = replaceAllLiteral(text, `${participant.alias}님`, withHonorific);
      return replaceAllLiteral(restoredHonorific, participant.alias, participant.nickname);
    }, value);
}

function formatDate(value: string) {
  const [, month, day] = value.split('-').map(Number);
  return `${month}월 ${day}일`;
}

function getRecommendedDates(snapshot: AnalysisSnapshot, limit = 3): string[] {
  const rankingPlan: AnalysisPlan = {
    status: 'ok',
    reason: null,
    target: 'dates',
    participantScope: { include: [], exclude: [] },
    dateScope: { dates: [], weekdays: [], from: null, to: null },
    conditions: [],
    conditionLogic: 'all',
    output: {
      kind: 'rank',
      metric: 'default_rank',
      direction: 'max',
      limit,
      position: null,
      includeTies: false,
    },
  };

  return (executeAnalysisPlan(rankingPlan, snapshot).dates ?? []).map((item) => item.date);
}

interface PlanNormalizationContext {
  question: string;
  participantAliases: string[];
  recommendedDates: string[];
}

function cloneAnalysisPlan(plan: AnalysisPlan): AnalysisPlan {
  return {
    ...plan,
    participantScope: {
      include: [...plan.participantScope.include],
      exclude: [...plan.participantScope.exclude],
    },
    dateScope: {
      dates: [...plan.dateScope.dates],
      weekdays: [...plan.dateScope.weekdays],
      from: plan.dateScope.from,
      to: plan.dateScope.to,
    },
    conditions: plan.conditions.map((condition) => ({
      ...condition,
      statuses: [...condition.statuses],
    })),
    output: { ...plan.output },
  };
}

function toAggregateCondition(condition: AnalysisCondition): AnalysisCondition {
  return {
    type: 'count',
    ref: null,
    statuses: [...condition.statuses],
    negate: condition.negate,
    operator: condition.operator ?? 'gte',
    value: condition.value ?? 1,
    denominator: null,
  };
}

function hasExplicitDateReference(question: string): boolean {
  return (
    /\b\d{4}[-./]\d{1,2}[-./]\d{1,2}\b/.test(question) ||
    /\d{1,2}\s*월\s*\d{1,2}\s*일/.test(question) ||
    /(?:^|\s)\d{1,2}\s*일(?:\s|$|[은는이가을를과와,?.!])/.test(question)
  );
}

function hasRelativeRangeReference(question: string): boolean {
  return /(오늘|내일|모레|이번\s*주|다음\s*주|이번\s*달|다음\s*달|부터|까지|이후|이전|사이|기간)/.test(
    question
  );
}

function hasDateScopeIntent(question: string): boolean {
  return (
    hasExplicitDateReference(question) ||
    hasRelativeRangeReference(question) ||
    /(주말|평일|월요일|화요일|수요일|목요일|금요일|토요일|일요일)/.test(question)
  );
}

function normalizeAnalysisPlan(
  plan: AnalysisPlan,
  context: PlanNormalizationContext
): AnalysisPlan {
  if (plan.status !== 'ok' || !plan.target) return plan;

  const normalized = cloneAnalysisPlan(plan);
  const question = context.question;
  const compactQuestion = question.replace(/\s+/g, '');
  const mentionedAliases = context.participantAliases.filter((alias) => question.includes(alias));

  // 조건 필드 정리: 엔진이 쓰지 않는 값은 제거해 LLM의 사소한 형식 오류를 무해하게 만든다.
  normalized.conditions = normalized.conditions.map((condition) => {
    if (condition.type === 'participant_status' || condition.type === 'date_status') {
      return {
        ...condition,
        operator: null,
        value: null,
        denominator: null,
      };
    }
    if (condition.type === 'count') {
      return { ...condition, ref: null, denominator: null };
    }
    return {
      ...condition,
      ref: null,
      denominator: condition.denominator ?? 'scoped_participants',
    };
  });

  // 명확한 전역 투표 참여율 질문은 LLM 표현 차이를 허용하지 않고 하나의 계획으로 고정한다.
  if (/(?:현재)?투표(?:참여율|참여비율)|투표한(?:사람|인원).*비율/.test(compactQuestion)) {
    normalized.target = 'participants';
    normalized.conditions = [];
    normalized.conditionLogic = 'all';
    if (!hasDateScopeIntent(question)) {
      normalized.dateScope = { dates: [], weekdays: [], from: null, to: null };
    }
    normalized.output = {
      kind: 'ratio',
      metric: 'responded',
      direction: null,
      limit: null,
      position: null,
      includeTies: false,
    };
    return normalized;
  }

  // 특정 참가자의 단순 투표 여부는 날짜별 상태가 아니라 활성 후보 전체의 responded 개수다.
  if (
    mentionedAliases.length === 1 &&
    /(투표했|투표함|투표한|응답했|응답함|응답한|투표여부|응답여부)/.test(compactQuestion) &&
    !hasExplicitDateReference(question)
  ) {
    const negative = /(안했|안함|하지않|아직.*(?:안|않)|미투표)/.test(compactQuestion);
    normalized.target = 'participants';
    normalized.participantScope.include = [mentionedAliases[0]];
    normalized.conditions = [
      {
        type: 'count',
        ref: null,
        statuses: ['responded'],
        negate: false,
        operator: negative ? 'eq' : 'gte',
        value: negative ? 0 : 1,
        denominator: null,
      },
    ];
    normalized.conditionLogic = 'all';
    normalized.output = {
      kind: 'list',
      metric: null,
      direction: null,
      limit: null,
      position: null,
      includeTies: false,
    };
  }

  // 모델이 "A는 투표했나?"를 participant_status로 표현해도 집계 의미로 안전하게 환원한다.
  if (normalized.target === 'participants' && normalized.participantScope.include.length === 1) {
    const onlyParticipant = normalized.participantScope.include[0];
    normalized.conditions = normalized.conditions.map((condition) => {
      if (condition.type === 'participant_status' && condition.ref === onlyParticipant) {
        return toAggregateCondition(condition);
      }
      return condition;
    });
  }

  // 날짜 목록에서 ref 없는 date_status는 "그 날짜에 해당 상태인 사람이 1명 이상"으로 환원한다.
  if (normalized.target === 'dates') {
    normalized.conditions = normalized.conditions.map((condition) => {
      if (condition.type === 'date_status' && !condition.ref) {
        return toAggregateCondition(condition);
      }
      return condition;
    });
  }

  const recommendedScopeAsked =
    /(?:유력(?:날짜)?후보|추천(?:날짜)?후보|추천날짜|추천top3|top3|top(?:날짜)?후보|탑(?:날짜)?후보|상위3(?:개)?)(?:중에|중|가운데)/i.test(
      compactQuestion
    );

  if (normalized.target === 'dates' && recommendedScopeAsked) {
    normalized.dateScope.dates = [...context.recommendedDates];

    // 추천 집합의 구성 자체만 묻는 질문에는 투표상태 조건을 임의로 끼우지 않는다.
    const hasVoteStateIntent =
      /(가능|불가능|애매|미정|투표|응답|미투표|인원|몇명|되는날|될수)/.test(compactQuestion) ||
      normalized.conditions.some(
        (condition) => condition.type === 'participant_status' && Boolean(condition.ref)
      );
    if (!hasVoteStateIntent) normalized.conditions = [];
  }

  // 특정 참가자를 지정하지 않은 "가능한 날 있나?"는 날짜별 available 인원 >= 1로 고정한다.
  if (
    normalized.target === 'dates' &&
    mentionedAliases.length === 0 &&
    /(가능한날|가능한날짜|가능한후보|되는날)/.test(compactQuestion) &&
    /(있나|있어|있나요|있습니까|존재)/.test(compactQuestion)
  ) {
    normalized.conditions = [
      {
        type: 'count',
        ref: null,
        statuses: ['available'],
        negate: false,
        operator: 'gte',
        value: 1,
        denominator: null,
      },
    ];
    normalized.conditionLogic = 'all';
    normalized.output = {
      kind: 'list',
      metric: null,
      direction: null,
      limit: null,
      position: null,
      includeTies: false,
    };
  }

  // 정확한 날짜/추천 집합을 묻지 않았는데 모델이 activeDates를 임의 열거하면 범위를 좁히지 않도록 제거한다.
  if (
    normalized.target === 'dates' &&
    normalized.dateScope.dates.length > 0 &&
    !recommendedScopeAsked &&
    !hasExplicitDateReference(question)
  ) {
    normalized.dateScope.dates = [];
  }

  // "주말/평일/요일"은 weekdays 필터만 사용한다. 불필요한 from/to까지 모델이 붙였으면 제거한다.
  if (
    normalized.target === 'dates' &&
    normalized.dateScope.weekdays.length > 0 &&
    !recommendedScopeAsked &&
    !hasExplicitDateReference(question) &&
    !hasRelativeRangeReference(question)
  ) {
    normalized.dateScope.from = null;
    normalized.dateScope.to = null;
  }

  // 출력과 무관한 메타 필드는 정리한다. 실제 의미는 target/scope/conditions/kind에만 남긴다.
  if (normalized.output.kind !== 'rank' && normalized.output.kind !== 'ratio') {
    normalized.output.metric = null;
    normalized.output.direction = null;
  }
  if (normalized.output.kind !== 'rank') {
    normalized.output.limit = null;
    normalized.output.includeTies = false;
  }
  if (normalized.output.kind !== 'list') normalized.output.position = null;

  return normalized;
}

function validateAnalysisPlanGrounding(
  plan: AnalysisPlan,
  context: {
    question: string;
    participantAliases: string[];
    requesterAlias: string;
    hostAlias: string | null;
  }
): void {
  if (plan.status !== 'ok') return;

  const allowedAliases = new Set(
    context.participantAliases.filter((alias) => context.question.includes(alias))
  );
  if (/(^|[\s,?.!])(나|나는|내가|내|저|저는|제가)(?=$|[\s,?.!])/u.test(context.question)) {
    allowedAliases.add(context.requesterAlias);
  }
  if (/(방장|호스트)/.test(context.question) && context.hostAlias) {
    allowedAliases.add(context.hostAlias);
  }

  const referencedAliases = new Set<string>([
    ...plan.participantScope.include,
    ...plan.participantScope.exclude,
  ]);
  for (const condition of plan.conditions) {
    if (condition.type === 'participant_status' && condition.ref) {
      referencedAliases.add(condition.ref);
    }
  }

  for (const alias of referencedAliases) {
    if (!allowedAliases.has(alias)) {
      throw new Error(`질문에 근거 없는 참가자 참조입니다: ${alias}`);
    }
  }

  for (const condition of plan.conditions) {
    if (
      condition.type === 'date_status' &&
      condition.ref &&
      !hasExplicitDateReference(context.question) &&
      !hasRelativeRangeReference(context.question)
    ) {
      throw new Error(`질문에 근거 없는 날짜 참조입니다: ${condition.ref}`);
    }
  }
}

function fallbackAnswer(result: AnalysisExecutionResult): string {
  if (result.kind === 'ratio' && result.ratio?.metric === 'responded') {
    const rate = Number.isInteger(result.ratio.percent)
      ? String(result.ratio.percent)
      : result.ratio.percent.toFixed(1);
    return `현재 투표 참여율은 ${rate}%예요. ${result.ratio.denominator}명 중 ${result.ratio.numerator}명이 참여했어요.`;
  }

  if (result.kind === 'count') {
    return result.target === 'dates'
      ? `해당하는 날짜는 ${result.totalMatched}개예요.`
      : `해당하는 참가자는 ${result.totalMatched}명이에요.`;
  }

  if (result.target === 'dates') {
    const rows = result.dates ?? [];
    if (rows.length === 0) return '해당하는 날짜는 없어요.';
    if (result.kind === 'compare' || result.kind === 'summary') {
      return rows
        .map(
          (item) =>
            `${formatDate(item.date)}는 가능 ${item.counts.available}명, 미정 ${item.counts.maybe}명, 불가능 ${item.counts.unavailable}명, 미투표 ${item.counts.no_vote}명이에요.`
        )
        .join(' ');
    }
    return `${rows.map((item) => formatDate(item.date)).join(', ')}이에요.`;
  }

  const rows = result.participants ?? [];
  if (rows.length === 0) return '해당하는 참가자는 없어요.';
  if (result.kind === 'summary') {
    return rows
      .map(
        (item) =>
          `${item.alias}님은 가능 ${item.counts.available}개, 미정 ${item.counts.maybe}개, 불가능 ${item.counts.unavailable}개, 미투표 ${item.counts.no_vote}개예요.`
      )
      .join(' ');
  }
  return `${rows.map((item) => `${item.alias}님`).join(', ')}이에요.`;
}

function buildNonExecutableAnswer(plan: AnalysisPlan, question: string): string | null {
  if (plan.status === 'ok') return null;

  const compactQuestion = question.replace(/\s+/g, '');

  if (plan.status === 'ambiguous') {
    if (/(웬만|대충|적당|괜찮|거의|많이되는|많이가능)/.test(compactQuestion)) {
      return '기준이 조금 애매해요. 가능한 사람 수를 기준으로 볼지, 미정까지 포함할지 조금만 더 알려주세요.';
    }

    if (/(날짜|언제|며칠|날)/.test(compactQuestion)) {
      return '어떤 기준으로 날짜를 고를지 조금만 더 알려주세요. 예를 들어 "가장 많이 가능한 날"처럼 물어보면 정확히 비교할 수 있어요.';
    }

    return '질문의 기준이 조금 애매해요. 비교할 대상이나 조건을 하나만 더 알려주세요.';
  }

  // unsupported
  if (
    /(장소|어디서|주소|가격|요금|비용|날씨|교통|노쇼|벌금|환불|수수료|준비물|정책)/.test(
      compactQuestion
    )
  ) {
    return '현재 AI가 확인할 수 있는 투표 정보만으로는 그 내용을 알 수 없어요. 투표 현황이나 유력 날짜는 알려드릴 수 있어요.';
  }

  if (/(만약|가정|라면|다면|하면|했을때|할때|바뀌|취소|빠지|안된다고)/.test(compactQuestion)) {
    return '현재 투표에 없는 가정을 반영해서 다시 계산하는 기능은 아직 정확히 지원하지 않아요. 현재 투표 기준의 유력 날짜나 날짜별 현황은 알려드릴 수 있어요.';
  }

  if (/(겹치는이틀|이틀조합|날짜조합|조합최적|조합)/.test(compactQuestion)) {
    return '여러 날짜를 하나의 조합으로 최적화하는 계산은 아직 지원하지 않아요. 날짜별 순위나 두 날짜 비교는 할 수 있어요.';
  }

  return '현재 투표 정보만으로는 정확히 답하기 어려운 질문이에요. 날짜별 가능 인원이나 참가자별 투표 현황은 확인해드릴 수 있어요.';
}

function getParticipantVoteCheckMode(plan: AnalysisPlan): 'voted' | 'not_voted' | null {
  if (
    plan.status !== 'ok' ||
    plan.target !== 'participants' ||
    plan.participantScope.include.length !== 1 ||
    plan.conditions.length !== 1
  ) {
    return null;
  }

  const condition = plan.conditions[0];
  if (
    condition.type !== 'count' ||
    condition.statuses.length !== 1 ||
    condition.statuses[0] !== 'responded' ||
    condition.value === null ||
    !condition.operator
  ) {
    return null;
  }

  let mode: 'voted' | 'not_voted' | null = null;

  if (
    (condition.operator === 'gte' && condition.value === 1) ||
    (condition.operator === 'gt' && condition.value === 0)
  ) {
    mode = 'voted';
  } else if (
    (condition.operator === 'eq' && condition.value === 0) ||
    (condition.operator === 'lte' && condition.value === 0) ||
    (condition.operator === 'lt' && condition.value === 1)
  ) {
    mode = 'not_voted';
  }

  if (!mode) return null;
  if (!condition.negate) return mode;
  return mode === 'voted' ? 'not_voted' : 'voted';
}

function hasRestrictedDateScope(plan: AnalysisPlan): boolean {
  return (
    plan.dateScope.dates.length > 0 ||
    plan.dateScope.weekdays.length > 0 ||
    plan.dateScope.from !== null ||
    plan.dateScope.to !== null
  );
}

/**
 * LLM2 없이도 의미와 단위를 확정할 수 있는 결과만 서버가 직접 문장화한다.
 * 단순해 보인다는 이유만으로 전부 서버 응답으로 돌리지 않고, 안전한 형태만 allowlist 한다.
 */
function buildDirectServerAnswer(
  plan: AnalysisPlan,
  result: AnalysisExecutionResult,
  question: string
): string | null {
  if (
    result.kind === 'ratio' &&
    result.target === 'participants' &&
    result.ratio?.metric === 'responded'
  ) {
    const formattedRate = Number.isInteger(result.ratio.percent)
      ? String(result.ratio.percent)
      : result.ratio.percent.toFixed(1);
    return `현재 투표 참여율은 ${formattedRate}%예요. ${result.ratio.denominator}명 중 ${result.ratio.numerator}명이 참여했어요.`;
  }

  const voteCheckMode = getParticipantVoteCheckMode(plan);
  if (voteCheckMode) {
    const alias = plan.participantScope.include[0];
    const conditionMatched = result.totalMatched > 0;

    if (voteCheckMode === 'voted') {
      return conditionMatched
        ? `네, ${alias}님은 투표에 참여했어요.`
        : `아니요, ${alias}님은 아직 투표하지 않았어요.`;
    }

    return conditionMatched
      ? `네, ${alias}님은 아직 투표하지 않았어요.`
      : `아니요, ${alias}님은 이미 투표에 참여했어요.`;
  }

  // 특정 참가자의 날짜별 상태 목록은 generic한 "조건에 맞는 날짜"보다 의미를 살려서 답한다.
  if (result.kind === 'list' && result.target === 'dates' && plan.conditions.length === 1) {
    const condition = plan.conditions[0];
    if (
      condition.type === 'participant_status' &&
      condition.ref &&
      !condition.negate &&
      condition.statuses.length === 1
    ) {
      const scopeMatches =
        plan.participantScope.include.length === 0 ||
        (plan.participantScope.include.length === 1 &&
          plan.participantScope.include[0] === condition.ref);

      if (scopeMatches) {
        const rows = result.dates ?? [];
        const dates = rows.map((item) => formatDate(item.date)).join(', ');
        const status = condition.statuses[0];

        if (status === 'available') {
          return rows.length > 0
            ? `${condition.ref}님이 가능하다고 선택한 날은 ${dates}이에요.`
            : `${condition.ref}님이 가능하다고 선택한 날은 없어요.`;
        }
        if (status === 'maybe') {
          return rows.length > 0
            ? `${condition.ref}님이 미정으로 선택한 날은 ${dates}이에요.`
            : `${condition.ref}님이 미정으로 선택한 날은 없어요.`;
        }
        if (status === 'unavailable') {
          return rows.length > 0
            ? `${condition.ref}님이 불가능하다고 선택한 날은 ${dates}이에요.`
            : `${condition.ref}님이 불가능하다고 선택한 날은 없어요.`;
        }
        if (status === 'no_vote') {
          if (rows.length > 0) {
            return `${condition.ref}님이 아직 투표하지 않은 날은 ${dates}이에요.`;
          }
          return hasRestrictedDateScope(plan)
            ? `${condition.ref}님은 해당 범위의 모든 날짜에 투표했어요.`
            : `${condition.ref}님은 모든 활성 날짜에 투표했어요.`;
        }
        if (status === 'responded') {
          return rows.length > 0
            ? `${condition.ref}님이 투표한 날은 ${dates}이에요.`
            : hasRestrictedDateScope(plan)
              ? `${condition.ref}님이 해당 범위에서 투표한 날짜는 없어요.`
              : `${condition.ref}님이 투표한 날짜는 없어요.`;
        }
      }
    }
  }

  // 존재 여부를 묻는 목록 질문은 서버가 계산 결과만으로 자연스럽게 답할 수 있다.
  if (result.kind === 'list' && /(있나|있어|있나요|있습니까|있니|존재)/.test(question)) {
    if (result.target === 'dates') {
      const rows = result.dates ?? [];
      if (rows.length === 0) return '아니요, 해당하는 날짜는 없어요.';
      return `네, 있어요. ${rows.map((item) => formatDate(item.date)).join(', ')}이에요.`;
    }

    const rows = result.participants ?? [];
    if (rows.length === 0) return '아니요, 해당하는 참가자는 없어요.';
    return `네, 있어요. ${rows.map((item) => `${item.alias}님`).join(', ')}이에요.`;
  }

  // 목록과 개수는 결과의 의미/단위가 서버에서 완전히 확정되어 있다.
  // 비교, 요약, 순위는 질문 맥락에 따른 설명 가치가 있으므로 LLM2로 넘긴다.
  if (result.kind === 'list' || result.kind === 'count') {
    return fallbackAnswer(result);
  }

  return null;
}

export interface IAnalysisService {
  analyze(
    slug: string,
    participantUuid: string,
    tokenCalendarSlug: string | undefined,
    question: string
  ): Promise<AnalysisAnswerResponse>;
}

export class AnalysisService implements IAnalysisService {
  constructor(
    private calendarService: ICalendarService,
    private participantService: IParticipantService,
    private voteService: IVoteService,
    private llmService: AnalysisLlmService
  ) {}

  async analyze(
    slug: string,
    participantUuid: string,
    tokenCalendarSlug: string | undefined,
    question: string
  ): Promise<AnalysisAnswerResponse> {
    if (tokenCalendarSlug && tokenCalendarSlug !== slug) {
      throw Errors.Forbidden('이 캘린더의 참가자 토큰이 아닙니다');
    }

    const calendar = await this.calendarService.getCalendarBySlug(slug);
    const requester = await this.participantService.getParticipantByUuid(participantUuid);
    if (requester.calendar_id !== calendar.id) {
      throw Errors.Forbidden('이 캘린더의 참가자가 아닙니다');
    }

    const [participants, voteStatus] = await Promise.all([
      this.participantService.getParticipantsByCalendarId(calendar.id),
      this.voteService.getVoteStatusByCalendar(calendar.id),
    ]);

    const analysisParticipants = buildAnalysisParticipants(participants, question);
    const requesterAlias = analysisParticipants.find((item) => item.id === requester.id)?.alias;
    if (!requesterAlias) throw Errors.Forbidden('이 캘린더의 참가자가 아닙니다');
    const hostId = participants.find((participant) => participant.role === 'host')?.id;
    const hostAlias = hostId
      ? (analysisParticipants.find((item) => item.id === hostId)?.alias ?? null)
      : null;

    const snapshot: AnalysisSnapshot = {
      participants: analysisParticipants,
      dates: voteStatus.map((item) => ({
        id: item.date_option_id,
        date: item.date_value,
        isEnabled: item.is_enabled,
        votes: new Map(item.votes.map((vote) => [vote.participant_id, vote.vote_type])),
      })),
    };

    const pseudonymizedQuestion = pseudonymizeQuestion(question, analysisParticipants);
    const parseContext = {
      question: pseudonymizedQuestion,
      participantAliases: analysisParticipants.map((item) => item.alias),
      activeDates: snapshot.dates.filter((item) => item.isEnabled).map((item) => item.date),
      recommendedDates: getRecommendedDates(snapshot),
      todayKst: todayDateOnlyKst(),
      requesterAlias,
      hostAlias,
    };

    let plan = normalizeAnalysisPlan(await this.llmService.parsePlan(parseContext), parseContext);

    const handleNonExecutablePlan = (candidate: AnalysisPlan): AnalysisAnswerResponse | null => {
      const answer = buildNonExecutableAnswer(candidate, question);
      if (!answer) return null;

      return {
        answer,
        fallbackUsed: false,
        result: null,
      };
    };

    const earlyAnswer = handleNonExecutablePlan(plan);
    if (earlyAnswer) return earlyAnswer;

    const validateExecutablePlan = (candidate: AnalysisPlan): void => {
      validateAnalysisPlanGrounding(candidate, parseContext);
      validateAnalysisPlanDomain(candidate, snapshot);
    };

    try {
      validateExecutablePlan(plan);
    } catch (error) {
      const firstReason = error instanceof Error ? error.message : String(error);
      logger.warn('AI 분석 계획 도메인 검증 실패, 1회 재해석', {
        reason: firstReason,
        target: plan.target,
        participantScope: plan.participantScope,
        dateScope: plan.dateScope,
        conditions: plan.conditions,
        output: plan.output,
      });

      plan = normalizeAnalysisPlan(
        await this.llmService.parsePlan({ ...parseContext, repairHint: firstReason }),
        parseContext
      );
      const retryEarlyAnswer = handleNonExecutablePlan(plan);
      if (retryEarlyAnswer) return retryEarlyAnswer;

      try {
        validateExecutablePlan(plan);
      } catch (retryError) {
        logger.warn('AI 분석 계획 도메인 검증 재시도 실패', {
          reason: retryError instanceof Error ? retryError.message : String(retryError),
          target: plan.target,
          participantScope: plan.participantScope,
          dateScope: plan.dateScope,
          conditions: plan.conditions,
          output: plan.output,
        });
        throw Errors.BadRequest(
          '질문을 정확히 이해하지 못했어요. 표현을 조금 바꿔서 다시 질문해주세요.'
        );
      }
    }

    const result = executeAnalysisPlan(plan, snapshot);

    const directAnswer = buildDirectServerAnswer(plan, result, pseudonymizedQuestion);
    if (directAnswer) {
      return {
        answer: restoreAliases(directAnswer, analysisParticipants),
        fallbackUsed: false,
        result,
      };
    }

    const fallback = restoreAliases(fallbackAnswer(result), analysisParticipants);

    try {
      const generated = await this.llmService.renderAnswer(pseudonymizedQuestion, plan, result);
      return {
        answer: restoreAliases(generated.trim(), analysisParticipants),
        fallbackUsed: false,
        result,
      };
    } catch {
      return {
        answer: fallback,
        fallbackUsed: true,
        result,
      };
    }
  }
}
