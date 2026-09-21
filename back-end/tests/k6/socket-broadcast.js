import { check } from 'k6';
import http from 'k6/http';
import ws from 'k6/ws';

import { BASE_URL, createCalendar, deleteCalendar, WS_URL } from './common.js';

export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '20s', target: 50 },
  ],
  thresholds: {
    checks: ['rate>0.95'],
    ws_connecting: ['p(95)<1000'],
  },
};

export function setup() {
  return createCalendar('Case 4: Socket Test', 'SocketHost', 2);
}

export default function (data) {
  const url = WS_URL;
  const slug = data.slug;
  let receivedVoteUpdated = false;

  const res = ws.connect(url, null, function (socket) {
    socket.on('open', function () {
      // 1. 연결되자마자 Socket.io Handshake 요청 (auth 토큰 페이로드 포함)
      // 서버의 socket.handshake.auth.token 으로 쏙 들어갑니다.
      socket.send(`40{"token":"${data.hostToken}"}`);
    });

    socket.on('message', function (msg) {
      // 서버가 Ping(2)을 보내면 Pong(3)으로 응답하여 연결 유지
      if (msg === '2') {
        socket.send('3');
      }

      // 2. 서버로부터 Socket.io 연결 승인(40)을 받으면, 그때 방에 입장!
      if (msg.startsWith('40')) {
        const joinEvent = '42["joinCalendarRoom"]';
        socket.send(joinEvent);

        if (__VU === 1) {
          socket.setTimeout(function () {
            http.post(
              `${BASE_URL}/calendars/${slug}/votes`,
              JSON.stringify({
                selectedDates: [data.start_date],
                voteType: 'available',
              }),
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${data.hostToken}`,
                },
              }
            );
          }, 1000);
        }
      }

      // 3. 누군가 투표해서 브로드캐스트가 날아오는지 확인
      if (msg.includes('voteUpdated')) {
        receivedVoteUpdated = true;
        check(msg, { 'voteUpdated 이벤트 수신 완료': (m) => m.includes('voteUpdated') });
      }
    });

    socket.on('error', function (e) {
      if (e.error() != 'websocket: close sent') {
        console.log('에러 발생: ', e.error());
      }
    });

    socket.setTimeout(function () {
      check(receivedVoteUpdated || __VU === 1, {
        '브로드캐스트 수신 또는 송신 VU': (ok) => ok,
      });
      socket.close();
    }, 20000);
  });

  check(res, { '웹소켓 업그레이드 성공': (r) => r && r.status === 101 });
}

export function teardown(data) {
  deleteCalendar(data.slug, data.hostToken);
}
