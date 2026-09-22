import { Calendar } from '../models/Calendar';
import { DateVoteStatus } from '../models/Vote';

interface CalendarClosedEmailInput {
  calendar: Calendar;
  voteStatus: DateVoteStatus[];
  participantsCount: number;
  ctaUrl: string;
}

type DecisionState = 'waiting' | 'coordination' | 'unanimous';

interface RankedDate {
  date: string;
  available: number;
  maybe: number;
  unavailable: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value: string): string {
  const normalized = value.slice(0, 10);
  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(date);

  return `${month}월 ${day}일 (${weekday})`;
}

function rankVoteDates(voteStatus: DateVoteStatus[]): RankedDate[] {
  return voteStatus
    .filter((item) => item.is_enabled)
    .map((item) => ({
      date: item.date_value,
      available: item.votes.filter((vote) => vote.vote_type === 'available').length,
      maybe: item.votes.filter((vote) => vote.vote_type === 'maybe').length,
      unavailable: item.votes.filter((vote) => vote.vote_type === 'unavailable').length,
    }))
    .sort(
      (left, right) =>
        right.available - left.available ||
        right.maybe - left.maybe ||
        left.date.localeCompare(right.date)
    );
}

function getDecisionState(
  rankedDates: RankedDate[],
  votedParticipants: number,
  participantsCount: number
): DecisionState {
  if (votedParticipants === 0) return 'waiting';
  if (participantsCount > 0 && rankedDates[0]?.available === participantsCount) {
    return 'unanimous';
  }
  return 'coordination';
}

function getDecisionContent(state: DecisionState) {
  if (state === 'waiting') {
    return {
      label: '투표 대기',
      description: '등록된 투표가 없습니다.',
      background: '#edf2f7',
      text: '#60748f',
    };
  }

  if (state === 'unanimous') {
    return {
      label: '전원 가능',
      description: '모두가 가능한 날짜가 있습니다.',
      background: '#e4f8ee',
      text: '#19875a',
    };
  }

  return {
    label: '조율 필요',
    description: '전원 가능한 날짜가 없습니다.',
    background: '#fff4d8',
    text: '#a66d00',
  };
}

function renderCandidateRows(rankedDates: RankedDate[], participantsCount: number): string {
  if (rankedDates.length === 0) {
    return `
      <tr>
        <td colspan="4" style="padding:28px 16px;text-align:center;color:#7185a2;">
          아직 투표 결과가 없습니다.
        </td>
      </tr>
    `;
  }

  return rankedDates
    .slice(0, 5)
    .map((item, index) => {
      const percent =
        participantsCount > 0 ? Math.round((item.available / participantsCount) * 100) : 0;

      return `
        <tr>
          <td style="padding:13px 8px;text-align:center;border-top:1px solid #e5edf6;">
            <span style="display:inline-block;width:30px;height:30px;line-height:30px;border-radius:15px;background:#e8f2ff;color:#2879e8;font-weight:800;">
              ${index + 1}
            </span>
          </td>
          <td style="padding:13px 8px;border-top:1px solid #e5edf6;color:#183762;font-weight:800;white-space:nowrap;">
            ${escapeHtml(formatDate(item.date))}
          </td>
          <td style="padding:13px 8px;border-top:1px solid #e5edf6;">
            <div style="font-size:12px;font-weight:700;color:#50729d;margin-bottom:6px;">${percent}%</div>
            <div style="height:8px;background:#e5ebf3;border-radius:999px;overflow:hidden;">
              <div style="height:8px;width:${percent}%;background:#2580ef;border-radius:999px;"></div>
            </div>
          </td>
          <td style="padding:13px 8px;border-top:1px solid #e5edf6;text-align:right;white-space:nowrap;">
            <span style="display:inline-block;padding:5px 9px;border-radius:999px;background:#e2f8eb;color:#168a57;font-size:12px;">가능 ${item.available}</span>
            <span style="display:inline-block;padding:5px 9px;border-radius:999px;background:#fff5d8;color:#a97300;font-size:12px;">애매 ${item.maybe}</span>
            <span style="display:inline-block;padding:5px 9px;border-radius:999px;background:#ffebeb;color:#dc5058;font-size:12px;">불가 ${item.unavailable}</span>
          </td>
        </tr>
      `;
    })
    .join('');
}

export function renderCalendarClosedEmail({
  calendar,
  voteStatus,
  participantsCount,
  ctaUrl,
}: CalendarClosedEmailInput): string {
  const enabledStatus = voteStatus.filter((item) => item.is_enabled);
  const votedParticipantIds = new Set(
    enabledStatus.flatMap((item) => item.votes.map((vote) => vote.participant_id))
  );
  const votedParticipants = votedParticipantIds.size;
  const participationPercent =
    participantsCount > 0
      ? Math.min(100, Math.round((votedParticipants / participantsCount) * 100))
      : 0;

  const rankedDates = rankVoteDates(enabledStatus);
  const leadingCandidate = votedParticipants > 0 ? (rankedDates[0] ?? null) : null;
  const decisionState = getDecisionState(rankedDates, votedParticipants, participantsCount);
  const decision = getDecisionContent(decisionState);

  const safeTitle = escapeHtml(calendar.title);
  const safeDescription = calendar.description ? escapeHtml(calendar.description) : '';
  const votePeriod = `${escapeHtml(formatDate(String(calendar.vote_start_date)))} ~ ${escapeHtml(
    formatDate(String(calendar.vote_end_date))
  )}`;

  const coordinationCta =
    decisionState === 'coordination'
      ? `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:22px;">
          <tr>
            <td style="padding:22px;border-radius:14px;background:#f5f9ff;text-align:center;">
              <div style="font-size:17px;font-weight:800;color:#19365e;margin-bottom:6px;">
                일정을 정하지 못하셨나요?
              </div>
              <div style="font-size:13px;line-height:20px;color:#7185a2;margin-bottom:16px;">
                새로운 후보 날짜로 다시 일정을 맞춰보세요.
              </div>
              <a href="${escapeHtml(ctaUrl)}"
                 style="display:inline-block;padding:12px 20px;border-radius:10px;background:#2879e8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;">
                다시 일정 맞추기
              </a>
            </td>
          </tr>
        </table>
      `
      : '';

  return `<!doctype html>
<html lang="ko">
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#17345d;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f7fb;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:720px;background:#ffffff;border:1px solid #e1eaf5;border-radius:18px;">
            <tr>
              <td style="padding:30px 28px 12px;">
                <div style="font-size:13px;font-weight:800;color:#2879e8;margin-bottom:8px;">모임 · 투표 마감 안내</div>
                <div style="font-size:28px;line-height:36px;font-weight:900;color:#17345d;">${safeTitle}</div>
                ${
                  safeDescription
                    ? `<div style="margin-top:8px;font-size:14px;line-height:21px;color:#7185a2;">${safeDescription}</div>`
                    : ''
                }
                <div style="margin-top:10px;font-size:13px;color:#7185a2;">투표 기간 ${votePeriod}</div>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="33.33%" valign="top" style="padding:0 5px;">
                      <div style="min-height:110px;padding:18px;border:1px solid #e1eaf5;border-radius:14px;background:#ffffff;">
                        <div style="font-size:13px;font-weight:800;color:#536c8e;">투표 참여율</div>
                        <div style="margin-top:10px;font-size:25px;font-weight:900;color:#17345d;">${votedParticipants} / ${participantsCount}명</div>
                        <div style="margin-top:16px;height:8px;background:#e5ebf3;border-radius:999px;overflow:hidden;">
                          <div style="height:8px;width:${participationPercent}%;background:#2879e8;border-radius:999px;"></div>
                        </div>
                        <div style="margin-top:6px;text-align:right;font-size:12px;font-weight:700;color:#607a9b;">${participationPercent}%</div>
                      </div>
                    </td>

                    <td width="33.33%" valign="top" style="padding:0 5px;">
                      <div style="min-height:110px;padding:18px;border:1px solid #e1eaf5;border-radius:14px;background:#ffffff;">
                        <div style="font-size:13px;font-weight:800;color:#536c8e;">가장 유력한 날짜</div>
                        <div style="margin-top:10px;font-size:19px;font-weight:900;color:#17345d;">
                          ${leadingCandidate ? escapeHtml(formatDate(leadingCandidate.date)) : '아직 없음'}
                        </div>
                        <div style="margin-top:16px;font-size:12px;font-weight:700;">
                          <span style="color:#168a57;">가능 ${leadingCandidate?.available ?? 0}</span>
                          <span style="color:#a97300;"> · 애매 ${leadingCandidate?.maybe ?? 0}</span>
                          <span style="color:#dc5058;"> · 불가 ${leadingCandidate?.unavailable ?? 0}</span>
                        </div>
                      </div>
                    </td>

                    <td width="33.33%" valign="top" style="padding:0 5px;">
                      <div style="min-height:110px;padding:18px;border:1px solid #e1eaf5;border-radius:14px;background:#ffffff;">
                        <div style="font-size:13px;font-weight:800;color:#536c8e;">결정 상태</div>
                        <div style="margin-top:10px;">
                          <span style="display:inline-block;padding:7px 11px;border-radius:999px;background:${decision.background};color:${decision.text};font-size:13px;font-weight:900;">
                            ${decision.label}
                          </span>
                        </div>
                        <div style="margin-top:14px;font-size:12px;line-height:18px;color:#7185a2;">${decision.description}</div>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 28px 28px;">
                <div style="padding:22px;border:1px solid #e1eaf5;border-radius:14px;">
                  <div style="font-size:20px;font-weight:900;color:#19365e;">유력 날짜 후보</div>
                  <div style="margin-top:5px;margin-bottom:16px;font-size:13px;color:#7185a2;">
                    참여자들이 가능한 날짜를 순위별로 확인해보세요.
                  </div>

                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                    <tr style="background:#edf5ff;color:#52719a;font-size:12px;font-weight:800;">
                      <td style="padding:10px 8px;text-align:center;">순위</td>
                      <td style="padding:10px 8px;">날짜</td>
                      <td style="padding:10px 8px;">가능 비율</td>
                      <td style="padding:10px 8px;text-align:right;">투표 수</td>
                    </tr>
                    ${renderCandidateRows(rankedDates, participantsCount)}
                  </table>

                  <div style="margin-top:16px;padding:11px 13px;border-radius:10px;background:#f1f7ff;color:#6c83a2;font-size:12px;line-height:18px;">
                    전원이 가능한 날짜가 없으면 가능 응답과 애매 응답이 많은 후보를 기준으로 조율해보세요.
                  </div>
                </div>

                ${coordinationCta}

                <div style="margin-top:24px;text-align:center;font-size:11px;line-height:17px;color:#9aaabd;">
                  이 메일은 모임의 투표 마감 결과 안내를 위해 자동 발송되었습니다.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
