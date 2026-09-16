import { CalendarDays, Check, Share2 } from "lucide-react";
import { useState } from "react";

import {
  getCalendarVoteState,
  getDaysUntilCalendarDate,
  type Calendar,
} from "../../../../../domains/calendar";
import {
  assetUrl,
  hideUnavailableAsset,
} from "../../../../../shared/assets/assetUrl";
import { formatDate } from "../../../../../shared/utils/format";
import {
  buttonClass,
  panelClass,
  secondaryButtonClass,
} from "../../../../../shared/ui/styles";
import { PLACEHOLDER_IMAGE_PATH } from "../../calendarHelpers";
import type { RealtimeConnectionState } from "../hooks/useCalendarRealtime";

interface CalendarHeroProps {
  calendar: Calendar;
  shareUrl: string;
  connectionState: RealtimeConnectionState;
}

export function CalendarHero({
  calendar,
  shareUrl,
  connectionState,
}: CalendarHeroProps) {
  const [copied, setCopied] = useState(false);
  const voteState = getCalendarVoteState(
    calendar.is_closed,
    getDaysUntilCalendarDate(calendar.vote_end_date),
    getDaysUntilCalendarDate(calendar.vote_start_date),
  );
  const isVotingClosed =
    voteState.label === "마감" || voteState.label === "조기 마감";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("아래 참여 링크를 복사해주세요.", shareUrl);
    }
  }

  return (
    <section
      className={`${panelClass} grid grid-cols-[145px_minmax(0,1fr)_auto] items-center gap-5 p-4 max-[980px]:grid-cols-[100px_minmax(0,1fr)] max-[980px]:gap-3.5 max-[800px]:grid-cols-[90px_1fr] max-[800px]:gap-3 max-[520px]:grid-cols-[80px_1fr] ${isVotingClosed ? "!bg-gray-200 opacity-75" : ""}`}
    >
      <img
        className="h-[116px] w-full rounded-[11px] bg-[#eaf4ff] object-contain max-[980px]:h-24 max-[800px]:h-[90px] max-[520px]:h-20"
        src={assetUrl(PLACEHOLDER_IMAGE_PATH)}
        alt={`${calendar.title} 대표 이미지`}
        onError={hideUnavailableAsset}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-[7px]">
          <span
            className={`inline-flex w-fit rounded-full px-[9px] py-[5px] text-xs font-black ${voteState.className}`}
          >
            {voteState.label}
          </span>
          {!isVotingClosed && (
            <span
              className={`inline-flex items-center gap-[5px] text-xs font-extrabold ${connectionState === "connected" ? "text-[#168b58]" : connectionState === "connecting" ? "text-[#a97300]" : "text-[#8191a8]"}`}
            >
              <i
                className={`size-[7px] rounded-full ${connectionState === "connected" ? "bg-[#1fc275] shadow-[0_0_0_3px_rgba(31,194,117,0.12)]" : connectionState === "connecting" ? "bg-[#f1ae33]" : "bg-[#aab8ca]"}`}
              />
              {connectionState === "connected"
                ? "실시간 연결됨"
                : connectionState === "connecting"
                  ? "실시간 연결 중"
                  : "연결 확인 필요"}
            </span>
          )}
        </div>
        <h1 className="mt-2 mb-1.5 truncate text-[27px] font-black tracking-[-0.05em] text-[#112d54] max-[800px]:text-[21px]">
          {calendar.title}
        </h1>
        <p className="m-0 truncate leading-6 text-[#7185a1] max-[520px]:whitespace-normal">
          {calendar.description || "참여자와 가능한 날짜를 선택해보세요."}
        </p>
        <span className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#5b7598]">
          <CalendarDays size={16} /> {formatDate(calendar.start_date)} —{" "}
          {formatDate(calendar.end_date)}
        </span>
      </div>
      <button
        type="button"
        className={`${buttonClass} ${secondaryButtonClass} self-start max-[980px]:col-span-full max-[980px]:w-full`}
        onClick={() => void copyLink()}
      >
        {copied ? (
          <>
            <Check size={17} /> 복사됨
          </>
        ) : (
          <>
            <Share2 size={17} /> 링크 공유
          </>
        )}
      </button>
    </section>
  );
}
