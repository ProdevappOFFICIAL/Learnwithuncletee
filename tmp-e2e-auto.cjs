const { io } = require('socket.io-client');

const API = 'http://localhost:4000/api';
const SOCKET = 'http://localhost:4000/uncleteepedia';
const ADMIN = { user_email: 'utp-smoke-admin@example.test', user_password: 'SmokeTest#2026' };
const STUDENT = { user_email: 'utp-smoke-student@example.test', user_password: 'SmokeTest#2026' };

const ok = (message) => console.log(`  ✓ ${message}`);
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  ok(message);
};

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${path} ${res.status}: ${json.message ?? ''}`);
  return json;
}

const connect = (token) =>
  new Promise((resolve, reject) => {
    const socket = io(SOCKET, {
      transports: ['websocket'],
      auth: token ? { token } : {},
      reconnection: false,
    });
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', reject);
  });

const join = (socket, sessionId) =>
  new Promise((resolve, reject) => {
    socket.emit('join', { sessionId }, (res) => (res?.ok ? resolve(res) : reject(new Error(res?.message))));
  });

const command = (socket, event, payload = {}) =>
  new Promise((resolve, reject) => {
    socket.emit(event, { ...payload, requestId: `${event}-${Date.now()}` }, (res) =>
      res?.ok ? resolve(res) : reject(new Error(res?.message)),
    );
  });

const waitState = (socket, predicate, label, timeout = 9000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('session:state', handler);
      reject(new Error(`timeout: ${label}`));
    }, timeout);
    const handler = (envelope) => {
      if (predicate(envelope.state)) {
        clearTimeout(timer);
        socket.off('session:state', handler);
        resolve(envelope.state);
      }
    };
    socket.on('session:state', handler);
  });

async function login(credentials, scope, deviceId) {
  const res = await api(`/auth/login/${scope}`, {
    method: 'POST',
    body: { ...credentials, deviceId, deviceName: 'Auto Advance E2E' },
  });
  return res.data.accessToken;
}

async function setup(adminToken, overrides) {
  const competition = (
    await api('/uncleteepedia/competitions', {
      method: 'POST',
      token: adminToken,
      body: {
        title: `Auto Advance ${Date.now()}`,
        format: 'SIXTY_SECONDS',
        gameplayMode: 'SHARED_LIVE',
        eligibilityLevel: 'ALL',
        overallDurationSeconds: 180,
        revealDurationSeconds: 5,
        pointsPerCorrect: 10,
        shuffleQuestions: false,
        shuffleOptions: false,
        settings: { autoAdvance: true, autoAdvanceDelaySeconds: 1 },
        ...overrides,
      },
    })
  ).data;
  await api(`/uncleteepedia/competitions/${competition.id}/questions`, {
    method: 'POST',
    token: adminToken,
    body: {
      questions: [
        { question: 'Auto Q1', options: ['Right', 'Wrong'], correctOption: 0 },
        { question: 'Auto Q2', options: ['Wrong', 'Right'], correctOption: 1 },
        { question: 'Auto Q3', options: ['Right', 'Wrong'], correctOption: 0 },
      ],
    },
  });
  const session = (
    await api(`/uncleteepedia/competitions/${competition.id}/sessions`, {
      method: 'POST',
      token: adminToken,
      body: {},
    })
  ).data;
  await api('/uncleteepedia/join', {
    method: 'POST',
    token: overrides.studentToken,
    body: { code: competition.joinCode },
  });
  return { competition, session };
}

async function main() {
  const adminToken = await login(ADMIN, 'admin', 'auto-admin');
  const studentToken = await login(STUDENT, 'student', 'auto-student');

  console.log('\nShared Live auto-advance');
  const shared = await setup(adminToken, { studentToken });
  const host = await connect(adminToken);
  const player = await connect(studentToken);
  const viewer = await connect(null);
  await join(host, shared.session.id);
  await join(player, shared.session.id);
  await join(viewer, shared.session.id);
  await command(host, 'host:start');

  const playerState = await waitState(player, (s) => s?.question?.id && s?.session?.status === 'LIVE', 'player q1');
  const roundOne = playerState.currentRound.id;
  await command(player, 'player:answer', {
    attemptId: playerState.attempt.id,
    roundId: roundOne,
    questionId: playerState.question.id,
    optionIndex: 0,
    clientRequestId: `auto-${Date.now()}`,
  });
  ok('contestant answered without clicking Next');

  const revealed = await waitState(
    viewer,
    (s) => s?.currentRound?.status === 'REVEALED' && s.currentRound.roundNumber === 1,
    'auto reveal',
  );
  assert(revealed.question.correctOption === 0, 'server revealed the answer automatically');

  const roundTwo = await waitState(
    viewer,
    (s) => s?.currentRound?.roundNumber === 2 && s?.question?.id,
    'auto round 2',
  );
  assert(roundTwo.currentRound.roundNumber === 2, 'server advanced to the next question automatically');

  const playerAuto = await waitState(
    player,
    (s) => s?.currentRound?.roundNumber === 2 && s?.question?.id,
    'player auto round 2',
  );
  assert(playerAuto.question.correctOption === undefined, 'auto-advanced question still hides the answer');

  await command(host, 'host:end');
  host.disconnect();
  player.disconnect();
  viewer.disconnect();

  console.log('\nHot Seat auto-advance');
  const hot = await setup(adminToken, {
    studentToken,
    gameplayMode: 'HOT_SEAT',
    title: `Hot Auto ${Date.now()}`,
  });
  const hotHost = await connect(adminToken);
  const hotPlayer = await connect(studentToken);
  await join(hotHost, hot.session.id);
  await join(hotPlayer, hot.session.id);
  await command(hotHost, 'host:start');
  const hotState = await waitState(
    hotPlayer,
    (s) => s?.session?.status === 'LIVE' && s?.question?.id,
    'hot q1',
  );
  assert(hotState.isActive === true, 'hot-seat contestant is active');
  await command(hotPlayer, 'player:answer', {
    attemptId: hotState.attempt.id,
    roundId: hotState.currentRound.id,
    questionId: hotState.question.id,
    optionIndex: 0,
    clientRequestId: `hot-${Date.now()}`,
  });
  const hotRoundTwo = await waitState(
    hotPlayer,
    (s) => s?.currentRound?.roundNumber === 2 && s?.question?.id,
    'hot auto round 2',
  );
  assert(hotRoundTwo.currentRound.roundNumber === 2, 'hot seat advanced automatically after the answer');
  await command(hotHost, 'host:end');
  hotHost.disconnect();
  hotPlayer.disconnect();

  console.log('\nAuto-advance disabled');
  const manual = await setup(adminToken, {
    studentToken,
    title: `Manual ${Date.now()}`,
    settings: { autoAdvance: false, autoAdvanceDelaySeconds: 1 },
  });
  const manualHost = await connect(adminToken);
  const manualPlayer = await connect(studentToken);
  await join(manualHost, manual.session.id);
  await join(manualPlayer, manual.session.id);
  await command(manualHost, 'host:start');
  const manualState = await waitState(
    manualPlayer,
    (s) => s?.question?.id && s?.session?.status === 'LIVE',
    'manual q1',
  );
  await command(manualPlayer, 'player:answer', {
    attemptId: manualState.attempt.id,
    roundId: manualState.currentRound.id,
    questionId: manualState.question.id,
    optionIndex: 0,
    clientRequestId: `manual-${Date.now()}`,
  });
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const manualCheck = await api(`/uncleteepedia/sessions/${manual.session.id}/state`, {
    token: adminToken,
  });
  assert(
    manualCheck.data.currentRound.roundNumber === 1 && manualCheck.data.currentRound.status === 'OPEN',
    'autoAdvance=false leaves the host in control',
  );
  await command(manualHost, 'host:end');
  manualHost.disconnect();
  manualPlayer.disconnect();

  for (const competition of [shared.competition, hot.competition, manual.competition]) {
    await api(`/uncleteepedia/competitions/${competition.id}`, {
      method: 'DELETE',
      token: adminToken,
    });
  }
  ok('test competitions cleaned up');
  console.log('\nAuto-advance checks passed.');
}

main().catch((error) => {
  console.error('\nAUTO E2E FAILED:', error.message);
  process.exitCode = 1;
});
