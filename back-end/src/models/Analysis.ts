export type AnalysisVoteStatus = 'available' | 'maybe' | 'unavailable' | 'no_vote' | 'responded';
export type AnalysisTarget = 'dates' | 'participants';
export type AnalysisOperator = 'eq' | 'gt' | 'gte' | 'lt' | 'lte';

export interface AnalysisParticipantScope {
  include: string[];
  exclude: string[];
}

export interface AnalysisDateScope {
  dates: string[];
  weekdays: number[];
  from: string | null;
  to: string | null;
}

export interface AnalysisCondition {
  type: 'participant_status' | 'date_status' | 'count' | 'ratio';
  ref: string | null;
  statuses: AnalysisVoteStatus[];
  negate: boolean;
  operator: AnalysisOperator | null;
  value: number | null;
  denominator: 'scoped_participants' | 'responded' | null;
}

export interface AnalysisOutput {
  kind: 'list' | 'count' | 'ratio' | 'rank' | 'summary' | 'compare' | null;
  metric: AnalysisVoteStatus | 'default_rank' | null;
  direction: 'max' | 'min' | null;
  limit: number | null;
  position: 'earliest' | 'latest' | null;
  includeTies: boolean;
}

export interface AnalysisPlan {
  status: 'ok' | 'unsupported' | 'ambiguous';
  reason: string | null;
  target: AnalysisTarget | null;
  participantScope: AnalysisParticipantScope;
  dateScope: AnalysisDateScope;
  conditions: AnalysisCondition[];
  conditionLogic: 'all' | 'any';
  output: AnalysisOutput;
}

export interface AnalysisSnapshotParticipant {
  id: number;
  alias: string;
  nickname: string;
}

export interface AnalysisSnapshotDate {
  id: number;
  date: string;
  isEnabled: boolean;
  votes: Map<number, Exclude<AnalysisVoteStatus, 'no_vote' | 'responded'>>;
}

export interface AnalysisSnapshot {
  participants: AnalysisSnapshotParticipant[];
  dates: AnalysisSnapshotDate[];
}

export interface AnalysisDateResult {
  type: 'date';
  date: string;
  counts: {
    available: number;
    maybe: number;
    unavailable: number;
    no_vote: number;
    responded: number;
  };
}

export interface AnalysisParticipantResult {
  type: 'participant';
  alias: string;
  counts: {
    available: number;
    maybe: number;
    unavailable: number;
    no_vote: number;
    responded: number;
  };
}

export interface AnalysisRatioResult {
  metric: 'responded';
  numerator: number;
  denominator: number;
  percent: number;
}

export interface AnalysisExecutionResult {
  target: AnalysisTarget;
  kind: NonNullable<AnalysisOutput['kind']>;
  totalMatched: number;
  dates?: AnalysisDateResult[];
  participants?: AnalysisParticipantResult[];
  selected?: AnalysisDateResult | AnalysisParticipantResult | null;
  ties?: Array<AnalysisDateResult | AnalysisParticipantResult>;
  ratio?: AnalysisRatioResult;
}

export interface AnalysisAnswerResponse {
  answer: string;
  fallbackUsed: boolean;
  result: AnalysisExecutionResult | null;
}
