import { Calendar } from '../../../models/Calendar';
import { DateVoteStatus } from '../../../models/Vote';
import { renderCalendarClosedEmail } from '../../../templates/calendarClosedEmail';

const calendar = {
  id: 1,
  slug: 'mail-template-test',
  title: '저녁 약속',
  description: '메일 템플릿 테스트',
  start_date: '2026-09-25',
  end_date: '2026-09-27',
  vote_start_date: '2026-09-20',
  vote_end_date: '2026-09-22',
  is_closed: true,
  owner_id: 1,
  created_at: new Date('2026-09-20T00:00:00Z'),
  updated_at: new Date('2026-09-22T00:00:00Z'),
  expired_at: new Date('2026-10-22T00:00:00Z'),
} as Calendar;

function makeStatus(availableCount: number, participantCount: number): DateVoteStatus[] {
  return [
    {
      date_option_id: 1,
      date_value: '2026-09-26',
      is_enabled: true,
      votes: Array.from({ length: participantCount }, (_, index) => ({
        participant_id: index + 1,
        participant_nickname: `참가자${index + 1}`,
        participant_color: '#000000',
        vote_type: index < availableCount ? 'available' : 'maybe',
      })),
    },
  ];
}

describe('renderCalendarClosedEmail', () => {
  it('조율 필요이면 다시 일정 맞추기 CTA를 포함한다', () => {
    const html = renderCalendarClosedEmail({
      calendar,
      voteStatus: makeStatus(2, 3),
      participantsCount: 3,
      ctaUrl: 'https://moim.junes.app',
    });

    expect(html).toContain('조율 필요');
    expect(html).toContain('다시 일정 맞추기');
    expect(html).toContain('https://moim.junes.app');
  });

  it('전원 가능이면 재조율 CTA를 포함하지 않는다', () => {
    const html = renderCalendarClosedEmail({
      calendar,
      voteStatus: makeStatus(3, 3),
      participantsCount: 3,
      ctaUrl: 'https://moim.junes.app',
    });

    expect(html).toContain('전원 가능');
    expect(html).not.toContain('다시 일정 맞추기');
  });

  it('참여율과 유력 날짜를 표시한다', () => {
    const html = renderCalendarClosedEmail({
      calendar,
      voteStatus: makeStatus(2, 3),
      participantsCount: 3,
      ctaUrl: 'https://moim.junes.app',
    });

    expect(html).toContain('3 / 3명');
    expect(html).toContain('100%');
    expect(html).toContain('9월 26일');
    expect(html).toContain('가능 2');
  });
});
