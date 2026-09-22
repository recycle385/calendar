import type { Calendar } from "../../../../../domains/calendar";
import type { Participant } from "../../../../../domains/participant";
import {
  VoteRecommendations,
  type DateVoteStatus,
} from "../../../../../domains/vote";
import {
  assetUrl,
  hideUnavailableAsset,
} from "../../../../../shared/assets/assetUrl";
import { eyebrowClass, panelClass } from "../../../../../shared/ui/styles";
import { PLACEHOLDER_IMAGE_PATH } from "../../calendarHelpers";
import type {
  OnlineCalendarUser,
  RealtimeConnectionState,
} from "../hooks/useCalendarRealtime";

interface DetailAsideProps {
  calendar?: Calendar;
  participants: Participant[];
  voteStatus: DateVoteStatus[];
  onlineUsers: OnlineCalendarUser[] | null;
  connectionState: RealtimeConnectionState;
  showRecommendations?: boolean;
}

export function DetailAside({
  calendar,
  participants,
  voteStatus,
  onlineUsers,
  connectionState,
  showRecommendations = true,
}: DetailAsideProps) {
  const onlineUuids = new Set(onlineUsers?.map((user) => user.sub) ?? []);

  return (
    <>
      {calendar && (
        <section
          className={`${panelClass} grid gap-2 overflow-hidden p-5 max-[800px]:[&:not(:first-child)]:hidden`}
        >
          <img
            className="h-[105px] w-full rounded-[10px] bg-[#eaf4ff] object-contain"
            src={assetUrl(PLACEHOLDER_IMAGE_PATH)}
            alt="캘린더 이미지"
            onError={hideUnavailableAsset}
          />
          <p className={`${eyebrowClass} mt-1 mb-0`}>CALENDAR STATUS</p>
          <strong className="leading-[1.45] text-[#1f4578]">
            {calendar.is_closed
              ? "투표가 마감되었어요."
              : "참여자의 응답을 기다리고 있어요."}
          </strong>
        </section>
      )}
      <section
        className={`${panelClass} overflow-hidden p-5 max-[800px]:hidden`}
      >
        <h2 className="mt-0 mb-4 text-base font-black text-[#183762]">
          참여자 ({participants.length})
        </h2>
        {participants.slice(0, 5).map((participant) => (
          <div
            className="mt-[9px] flex items-center gap-2"
            key={participant.uuid}
          >
            <span
              className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-white text-xs font-black text-white shadow-[0_2px_6px_#b7c8df]"
              style={{ backgroundColor: participant.color_code }}
            >
              {participant.nickname.slice(0, 1)}
            </span>
            <strong className="text-xs text-[#426082]">
              {participant.nickname}
            </strong>
            <i
              className={`ml-auto block size-[7px] rounded-full ${connectionState === "connected" && onlineUuids.has(participant.uuid) ? "bg-[#1fc275] shadow-[0_0_0_3px_rgba(31,194,117,0.12)]" : "bg-[#aab8ca]"}`}
              title={
                connectionState === "connected" &&
                onlineUuids.has(participant.uuid)
                  ? "온라인"
                  : "오프라인 또는 확인 중"
              }
            />
          </div>
        ))}
      </section>
      {showRecommendations && <VoteRecommendations voteStatus={voteStatus} />}
    </>
  );
}
