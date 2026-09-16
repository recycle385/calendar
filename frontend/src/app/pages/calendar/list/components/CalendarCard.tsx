import { CalendarDays, Clock3, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import {
  getCalendarVoteState,
  getDaysUntilCalendarDate,
  type JoinedCalendar,
} from "../../../../../domains/calendar";
import {
  assetUrl,
  hideUnavailableAsset,
} from "../../../../../shared/assets/assetUrl";
import {
  getCalendarImageAlt,
  PLACEHOLDER_IMAGE_PATH,
} from "../../calendarHelpers";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const KOREAN_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: "UTC",
});

function parseDateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function formatShortDate(value: string) {
  const [, month, day] = value.slice(0, 10).split("-");
  return `${month}.${day}`;
}

function formatKoreanDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return KOREAN_DATE_FORMATTER.format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatVoteEndDate(value: string, daysLeft: number) {
  const [, month, day] = value.slice(0, 10).split("-").map(Number);
  const dateLabel = `${month}월 ${day}일`;

  if (daysLeft === 0) return `오늘 (${dateLabel})`;
  if (daysLeft === 1) return `내일 (${dateLabel})`;
  if (daysLeft === -1) return `어제 (${dateLabel})`;
  return formatKoreanDate(value);
}

function getCandidateDayCount(startDate: string, endDate: string) {
  return (
    Math.floor(
      (parseDateOnly(endDate) - parseDateOnly(startDate)) / DAY_IN_MS,
    ) + 1
  );
}

export function CalendarCard({ calendar }: { calendar: JoinedCalendar }) {
  const candidateDayCount = getCandidateDayCount(
    calendar.start_date,
    calendar.end_date,
  );
  const daysUntilVoteStart = getDaysUntilCalendarDate(calendar.vote_start_date);
  const daysUntilVoteEnd = getDaysUntilCalendarDate(calendar.vote_end_date);
  const voteState = getCalendarVoteState(
    calendar.is_closed,
    daysUntilVoteEnd,
    daysUntilVoteStart,
  );
  const isBeforeVoting = voteState.label === "시작 전";
  const isVotingOpen =
    !calendar.is_closed && !isBeforeVoting && daysUntilVoteEnd >= 0;
  const voteDeadlineLabel = isBeforeVoting
    ? `투표 시작 D-${daysUntilVoteStart}`
    : isVotingOpen
      ? `투표 마감 D-${daysUntilVoteEnd}`
      : "투표 종료";
  const voteDeadlineDateLabel = isBeforeVoting
    ? formatKoreanDate(calendar.vote_start_date)
    : calendar.is_closed
      ? null
      : formatVoteEndDate(calendar.vote_end_date, daysUntilVoteEnd);
  const isVotingClosed =
    voteState.label === "마감" || voteState.label === "조기 마감";

  return (
    <Link
      className={`group grid min-h-[190px] cursor-pointer gap-3.5 rounded-2xl border border-[#dfe8f3] p-3.5 text-inherit shadow-[0_4px_14px_rgba(33,75,125,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#b8d5fb] hover:shadow-[0_12px_25px_rgba(30,100,192,0.1)] ${
        isVotingClosed ? "bg-gray-200 opacity-65" : "bg-white"
      }`}
      to={`/c/${calendar.slug}`}
    >
      <div className="grid min-w-0 grid-cols-[78px_minmax(0,1fr)_auto] gap-3">
        <img
          className="size-[78px] rounded-xl bg-[#edf5ff] object-contain"
          src={assetUrl(PLACEHOLDER_IMAGE_PATH)}
          alt={getCalendarImageAlt(calendar.title)}
          onError={hideUnavailableAsset}
        />

        <div className="min-w-0 self-center">
          <h2 className="m-0 truncate text-lg font-black tracking-[-0.035em] text-[#102d55]">
            {calendar.title}
          </h2>
          <p className="mt-1 mb-0 line-clamp-2 text-sm leading-[1.45] text-[#6b809e]">
            {calendar.description || "설명 없이 만든 캘린더예요."}
          </p>
        </div>

        <span
          className={`mt-1 inline-flex h-fit rounded-full px-2.5 py-1 text-xs font-black ${voteState.className}`}
        >
          {voteState.label}
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 text-[13px] font-bold text-[#647d9f] max-[480px]:grid-cols-1">
        <div className="grid min-w-0 gap-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays className="shrink-0 text-[#55779f]" size={16} />
            <span className="shrink-0">후보 일정</span>
            <span className="truncate text-[#365476]">
              {formatShortDate(calendar.start_date)} ~{" "}
              {formatShortDate(calendar.end_date)}
            </span>
            <span className="shrink-0 rounded-full bg-[#edf3fa] px-2 py-1 text-xs text-[#6680a1]">
              {candidateDayCount}일
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#edf4fd] text-[#55779f]">
              <UserRound size={16} />
            </span>
            <span>현재 {calendar.participant_count ?? 0}명 참여</span>
            <span className="rounded-full bg-[#edf4fd] px-2 py-1 text-xs font-black text-[#426b9e]">
              {calendar.participantRole === "host" ? "방장" : "게스트"} ·{" "}
              {calendar.profileType === "alias" ? "별명" : "내 계정"}
            </span>
          </div>
        </div>

        <div className="grid justify-items-end gap-1 max-[480px]:justify-items-start max-[480px]:pl-0.5">
          <div
            className={`flex items-center gap-1.5 ${voteState.accentClassName}`}
          >
            <Clock3 className="shrink-0" size={18} />
            <strong>{voteDeadlineLabel}</strong>
          </div>
          {voteDeadlineDateLabel ? (
            <span className="pr-0.5 text-xs font-bold text-[#7186a3]">
              {voteDeadlineDateLabel}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
