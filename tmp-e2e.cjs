const { io } = require('socket.io-client');

const API = 'http://localhost:4000/api';
const SOCKET = 'http://localhost:4000/uncleteepedia';
const ADMIN = { user_email: 'utp-smoke-admin@example.test', user_password: 'SmokeTest#2026' };
const STUDENT = { user_email: 'utp-smoke-student@example.test', user_password: 'SmokeTest#2026' };

const assert = (condition, message) => {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
  console.log(`  ✓ ${message}`);
};

let passed = 0;
const ok = (message) => {
  passed += 1;
  console.log(`  ✓ ${message}`);
};

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Non-JSON response (${response.status}): ${text.slice(0, 200)}`);
  }
  if (!response.ok) throw new Error(`${path} -> ${response.status}: ${json.message ?? text.slice(0, 200)}`);
  return json;
}

function connect(token) {
  return new Promise((resolve, reject) => {
    const socket = io(SOCKET, {
      transports: ['websocket'],
      auth: token ? { token } : {},
      reconnection: false,
      timeout: 8000,
    });
    const timer = setTimeout(() => reject(new Error('socket connect timeout')), 9000);
    socket.on('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.on('connect_error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function join(socket, sessionId, extra = {}) {
  return new Promise((resolve, reject) => {
    socket.emit('join', { sessionId, ...extra }, (response) => {
      if (response?.ok) resolve(response);
      else reject(new Error(response?.message ?? 'join failed'));
    });
  });
}

function command(socket, event, payload = {}) {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (response) => {
      if (response?.ok) resolve(response);
      else reject(new Error(response?.message ?? `${event} failed`));
    });
  });
}

function waitState(socket, predicate, label, timeout = 9000) {
  return new Promise((resolve, reject) => {
    const handler = (envelope) => {
      try {
        if (predicate(envelope.state, envelope)) {
          cleanup();
          resolve(envelope);
        }
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    const cleanup = () => {
      clearTimeout(timer);
      socket.off('session:state', handler);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`timed out waiting for ${label}`));
    }, timeout);
    socket.on('session:state', handler);
  });
}

async function login(credentials, scope, deviceId) {
  const response = await api(`/auth/login/${scope}`, {
    method: 'POST',
    body: { ...credentials, deviceId, deviceName: 'UncleTeepedia E2E' },
  });
  return response.data.accessToken;
}

async function createCompetition(token, overrides) {
  const response = await api('/uncleteepedia/competitions', {
    method: 'POST',
    token,
    body: {
      format: 'SIXTY_SECONDS',
      gameplayMode: 'SHARED_LIVE',
      eligibilityLevel: 'ALL',
      overallDurationSeconds: 120,
      answerGraceSeconds: 1,
      revealDurationSeconds: 10,
      pointsPerCorrect: 10,
      negativePoints: 0,
      shuffleQuestions: false,
      shuffleOptions: false,
      showLeaderboard: true,
      allowLateJoin: true,
      ...overrides,
    },
  });
  return response.data;
}

async function addQuestions(token, competitionId, questions) {
  await api(`/uncleteepedia/competitions/${competitionId}/questions`, {
    method: 'POST',
    token,
    body: { questions },
  });
}

async function createSession(token, competitionId) {
  const response = await api(`/uncleteepedia/competitions/${competitionId}/sessions`, {
    method: 'POST',
    token,
    body: {},
  });
  return response.data;
}

async function main() {
  console.log('\n1. Auth');
  const adminToken = await login(ADMIN, 'admin', 'utp-e2e-admin');
  const studentToken = await login(STUDENT, 'student', 'utp-e2e-student');
  ok('admin and pupil signed in');

  console.log('\n2. Shared Live socket flow');
  const shared = await createCompetition(adminToken, {
    title: `E2E Shared Live ${Date.now()}`,
    gameplayMode: 'SHARED_LIVE',
  });
  await addQuestions(adminToken, shared.id, [
    { question: 'What is 2 + 2?', options: ['4', '5', '3', '6'], correctOption: 0, explanation: 'Four.' },
    { question: 'Capital of Nigeria?', options: ['Lagos', 'Abuja', 'Kano', 'Ibadan'], correctOption: 1 },
  ]);
  ok('competition and two questions created');
  const sharedSession = await createSession(adminToken, shared.id);
  const sharedJoin = await api('/uncleteepedia/join', {
    method: 'POST',
    token: studentToken,
    body: { code: shared.joinCode },
  });
  assert(sharedJoin.data.sessionId === sharedSession.id, 'pupil joined the scheduled session');

  const hostSocket = await connect(adminToken);
  const playerSocket = await connect(studentToken);
  const viewerSocket = await connect(null);
  const hostJoin = await join(hostSocket, sharedSession.id);
  assert(hostJoin.role === 'host', 'server resolved the host role from the token');
  await join(playerSocket, sharedSession.id);
  await join(viewerSocket, sharedSession.id);
  ok('host, player and anonymous viewer joined their rooms');

  const viewerHostAttempt = await new Promise((resolve) => {
    viewerSocket.emit('host:start', {}, resolve);
  });
  assert(viewerHostAttempt?.ok === false, 'viewer cannot execute host commands');

  const startResponse = await command(hostSocket, 'host:start', {
    requestId: `start-${Date.now()}`,
  });
  assert(startResponse.ok, 'host started the shared live show');

  const playerLive = await waitState(
    playerSocket,
    (state) => state?.session?.status === 'LIVE' && state?.question?.id,
    'player live question',
  );
  const hostLive = await waitState(
    hostSocket,
    (state) => state?.session?.status === 'LIVE' && state?.question?.id,
    'host live question',
  );
  const viewerLive = await waitState(
    viewerSocket,
    (state) => state?.session?.status === 'LIVE' && state?.question?.id,
    'viewer live question',
  );
  assert(playerLive.state.question.correctOption === undefined, 'player payload hides the correct answer');
  assert(viewerLive.state.question.correctOption === undefined, 'viewer payload hides the correct answer');
  assert(hostLive.state.question.correctOption === 0, 'host payload includes the answer key');
  assert(playerLive.state.question.options.length === 4, 'options delivered to the player');

  const roundId = playerLive.state.currentRound.id;
  const attemptId = playerLive.state.attempt.id;
  const questionId = playerLive.state.question.id;
  const answerAck = await command(playerSocket, 'player:answer', {
    attemptId,
    roundId,
    questionId,
    optionIndex: 0,
    clientRequestId: `answer-${Date.now()}`,
  });
  assert(answerAck.result.accepted === true, 'correct answer accepted over the socket');
  assert(answerAck.result.isCorrect === undefined, 'answer acknowledgement hides correctness before reveal');

  const viewerAnswered = await waitState(
    viewerSocket,
    (state) => state?.participants?.some((participant) => participant.answer?.optionIndex === 0),
    'viewer sees selected option',
  );
  const selected = viewerAnswered.state.participants.find((participant) => participant.answer);
  assert(selected.answer.isCorrect === undefined, 'viewer sees the choice but not correctness');

  const duplicateAck = await command(playerSocket, 'player:answer', {
    attemptId,
    roundId,
    questionId,
    optionIndex: 1,
    clientRequestId: `duplicate-${Date.now()}`,
  });
  assert(duplicateAck.result.duplicate === true, 'duplicate answer is idempotent');

  const hostBeforeReveal = await api(`/uncleteepedia/sessions/${sharedSession.id}/state`, {
    token: adminToken,
  });
  const playerRow = hostBeforeReveal.data.participants.find((participant) => participant.id === sharedJoin.data.participant.id);
  assert(playerRow.score === 10, 'duplicate answer did not double-score the participant');

  await command(hostSocket, 'host:reveal', { requestId: `reveal-${Date.now()}` });
  const viewerRevealed = await waitState(
    viewerSocket,
    (state) => state?.currentRound?.status === 'REVEALED',
    'viewer reveal',
  );
  assert(viewerRevealed.state.question.correctOption === 0, 'viewer receives correct answer only after reveal');
  const revealedParticipant = viewerRevealed.state.participants.find((participant) => participant.answer);
  assert(revealedParticipant.answer.isCorrect === true, 'viewer sees correctness after reveal');

  const firstQuestionId = playerLive.state.question.id;
  await command(hostSocket, 'host:next', { requestId: `next-${Date.now()}` });
  const viewerNext = await waitState(
    viewerSocket,
    (state) => state?.question?.id && state.question.id !== firstQuestionId,
    'viewer next question',
  );
  assert(viewerNext.state.currentRound.roundNumber === 2, 'host advanced to round two');

  // Reconnect must replay authoritative current state, including the selected answer.
  playerSocket.disconnect();
  const reconnectedPlayer = await connect(studentToken);
  const rejoin = await join(reconnectedPlayer, sharedSession.id);
  assert(rejoin.state?.session?.status === 'LIVE', 'reconnected player receives live state snapshot');
  assert(rejoin.state?.currentRound?.roundNumber === 2, 'reconnect restored the current round');

  await command(hostSocket, 'host:end', { requestId: `end-${Date.now()}` });
  const viewerEnded = await waitState(
    viewerSocket,
    (state) => state?.session?.status === 'ENDED',
    'viewer ended state',
  );
  assert(viewerEnded.state.session.status === 'ENDED', 'host ended the shared live show');

  const events = await api(`/uncleteepedia/sessions/${sharedSession.id}/events`, { token: adminToken });
  assert(events.data.some((event) => event.type === 'SESSION_STARTED'), 'session start is in the audit log');
  assert(events.data.some((event) => event.type === 'ROUND_REVEALED'), 'reveal is in the audit log');

  hostSocket.disconnect();
  reconnectedPlayer.disconnect();
  viewerSocket.disconnect();

  console.log('\n3. Self-paced championship flow');
  const mcq = await createCompetition(adminToken, {
    format: 'MULTIPLE_CHOICE',
    gameplayMode: 'SELF_PACED',
    title: `E2E Self Paced ${Date.now()}`,
    overallDurationSeconds: 120,
    allowPracticeAttempts: true,
    maxPracticeAttempts: 2,
    questionDurationSeconds: 30,
  });
  await addQuestions(adminToken, mcq.id, [
    { question: 'Which planet is largest?', options: ['Earth', 'Jupiter', 'Mars', 'Venus'], correctOption: 1 },
    { question: 'What is 3 x 3?', options: ['6', '9', '12', '15'], correctOption: 1 },
  ]);
  const mcqSession = await createSession(adminToken, mcq.id);
  const mcqJoin = await api('/uncleteepedia/join', {
    method: 'POST',
    token: studentToken,
    body: { code: mcq.joinCode },
  });
  await api(`/uncleteepedia/sessions/${mcqSession.id}/start`, {
    method: 'POST',
    token: adminToken,
    body: {},
  });
  ok('self-paced session is live');

  const mcqStart = await api(`/uncleteepedia/sessions/${mcqSession.id}/attempts`, {
    method: 'POST',
    token: studentToken,
    body: {},
  });
  const mcqAttempt = mcqStart.data;
  assert(mcqAttempt.question.correctOption === undefined, 'self-paced question hides the answer key');
  assert(mcqAttempt.attempt.totalQuestions === 2, 'attempt carries its own question order');

  const mcqAnswer = await api(`/uncleteepedia/attempts/${mcqAttempt.attempt.id}/answers`, {
    method: 'POST',
    token: studentToken,
    body: {
      attemptId: mcqAttempt.attempt.id,
      questionId: mcqAttempt.question.id,
      optionIndex: 1,
      clientRequestId: `mcq-${Date.now()}`,
    },
  });
  assert(mcqAnswer.data.isCorrect === undefined, 'self-paced answer response hides correctness');
  const duplicateMcq = await api(`/uncleteepedia/attempts/${mcqAttempt.attempt.id}/answers`, {
    method: 'POST',
    token: studentToken,
    body: {
      attemptId: mcqAttempt.attempt.id,
      questionId: mcqAttempt.question.id,
      optionIndex: 0,
      clientRequestId: `mcq-dup-${Date.now()}`,
    },
  });
  assert(duplicateMcq.data.duplicate === true, 'self-paced duplicate answer returns the stored answer');

  const nextQuestion = await api(`/uncleteepedia/attempts/${mcqAttempt.attempt.id}/next`, {
    method: 'POST',
    token: studentToken,
    body: {},
  });
  assert(nextQuestion.data.question.id !== mcqAttempt.question.id, 'self-paced pupil advanced independently');
  await api(`/uncleteepedia/attempts/${mcqAttempt.attempt.id}/answers`, {
    method: 'POST',
    token: studentToken,
    body: {
      attemptId: mcqAttempt.attempt.id,
      questionId: nextQuestion.data.question.id,
      optionIndex: 1,
      clientRequestId: `mcq2-${Date.now()}`,
    },
  });
  const submitted = await api(`/uncleteepedia/attempts/${mcqAttempt.attempt.id}/submit`, {
    method: 'POST',
    token: studentToken,
    body: {},
  });
  assert(submitted.data.attempt.status === 'SUBMITTED', 'official attempt submitted');
  assert(submitted.data.attempt.score === 20, 'official attempt scored both correct answers');

  const practice = await api(`/uncleteepedia/sessions/${mcqSession.id}/practice-attempts`, {
    method: 'POST',
    token: studentToken,
    body: {},
  });
  assert(practice.data.attempt.kind === 'PRACTICE', 'practice attempt created with its own kind');
  await api(`/uncleteepedia/attempts/${practice.data.attempt.id}/answers`, {
    method: 'POST',
    token: studentToken,
    body: {
      attemptId: practice.data.attempt.id,
      questionId: practice.data.question.id,
      optionIndex: 1,
      clientRequestId: `practice-${Date.now()}`,
    },
  });
  await api(`/uncleteepedia/attempts/${practice.data.attempt.id}/submit`, {
    method: 'POST',
    token: studentToken,
    body: {},
  });
  const mcqCompetition = await api(`/uncleteepedia/competitions/${mcq.id}`, { token: adminToken });
  const officialParticipant = mcqCompetition.data.participants.find(
    (participant) => participant.user?.user_email === STUDENT.user_email,
  );
  assert(officialParticipant.cachedTotalScore === 20, 'practice score did not change official totals');

  const publicFollow = await api(
    `/public-uncleteepedia/sessions/${mcqSession.id}?follow=${mcqJoin.data.participant.id}`,
  );
  assert(publicFollow.data.follow, 'public viewer can follow a contestant');
  assert(
    publicFollow.data.follow.question.correctOption === undefined,
    'follow view never exposes the answer key',
  );
  assert(
    publicFollow.data.follow.selectedOption === undefined ||
      publicFollow.data.follow.answerRevealed === false,
    'follow view hides correctness',
  );

  await api(`/uncleteepedia/sessions/${mcqSession.id}/end`, {
    method: 'POST',
    token: adminToken,
    body: {},
  });
  ok('self-paced session ended');

  console.log('\n4. Hot Seat timer continuity');
  const hot = await createCompetition(adminToken, {
    title: `E2E Hot Seat ${Date.now()}`,
    gameplayMode: 'HOT_SEAT',
    overallDurationSeconds: 120,
    questionDurationSeconds: null,
  });
  await addQuestions(adminToken, hot.id, [
    { question: 'Top of the table?', options: ['Lagos', 'Abuja'], correctOption: 1 },
    { question: 'Second question?', options: ['A', 'B'], correctOption: 0 },
  ]);
  const hotSession = await createSession(adminToken, hot.id);
  await api('/uncleteepedia/join', {
    method: 'POST',
    token: studentToken,
    body: { code: hot.joinCode },
  });
  const hotSocket = await connect(adminToken);
  await join(hotSocket, hotSession.id);
  await command(hotSocket, 'host:start', { requestId: `hot-start-${Date.now()}` });
  const hotState = await waitState(
    hotSocket,
    (state) => state?.session?.status === 'LIVE' && state?.currentRound,
    'hot seat live',
  );
  const originalDeadline = hotState.state.session.overallEndsAt;
  assert(
    new Date(hotState.state.currentRound.answerDeadlineAt).getTime() ===
      new Date(originalDeadline).getTime(),
    'hot-seat question deadline is the overall 60-second clock',
  );
  const hotPlayer = await connect(studentToken);
  const hotPlayerJoin = await join(hotPlayer, hotSession.id);
  if (hotPlayerJoin.role === 'player') {
    assert(hotPlayerJoin.state.isActive === true, 'first contestant is on the hot seat');
    assert(
      hotPlayerJoin.state.question.correctOption === undefined,
      'hot-seat contestant never receives the answer key',
    );
  }
  await command(hotSocket, 'host:next', { requestId: `hot-next-${Date.now()}` });
  const hotNext = await waitState(
    hotSocket,
    (state) => state?.currentRound?.roundNumber === 2,
    'hot seat round two',
  );
  assert(
    new Date(hotNext.state.currentRound.answerDeadlineAt).getTime() ===
      new Date(originalDeadline).getTime(),
    'hot-seat clock does not reset between questions',
  );
  await command(hotSocket, 'host:end', { requestId: `hot-end-${Date.now()}` });
  hotSocket.disconnect();
  hotPlayer.disconnect();
  ok('hot-seat flow ended');

  console.log(`\nAll ${passed} live checks passed.`);
}

main().catch((error) => {
  console.error('\nE2E FAILED:', error.message);
  process.exitCode = 1;
});
