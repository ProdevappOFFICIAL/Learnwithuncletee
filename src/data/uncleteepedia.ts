export type UncleTeepediaFormat = 'SIXTY_SECONDS' | 'MULTIPLE_CHOICE';
export type UncleTeepediaGameplayMode = 'HOT_SEAT' | 'SHARED_LIVE' | 'SELF_PACED';
export type UncleTeepediaStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'LIVE'
  | 'PAUSED'
  | 'ENDED'
  | 'CANCELLED';
export type UncleTeepediaEligibility = 'ALL' | 'JUNIOR' | 'SENIOR';

export interface UncleTeepediaQuestionItem {
  id: string;
  competitionId: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation?: string | null;
  imageUrl?: string | null;
  order: number;
  points?: number | null;
}

export interface UncleTeepediaParticipantItem {
  id: string;
  name: string;
  status: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  currentQuestionIndex?: number;
  answer?: { optionIndex: number; isCorrect?: boolean } | null;
  attemptStatus?: string | null;
  questionIndex?: number;
  totalQuestions?: number;
  currentQuestion?: {
    id: string;
    question: string;
    options: string[];
    correctOption?: number | null;
    imageUrl?: string | null;
  } | null;
}

export interface UncleTeepediaSessionItem {
  id: string;
  label?: string | null;
  status: string;
  createdAt: string;
  overallStartedAt?: string | null;
  overallEndsAt?: string | null;
  currentRoundNumber?: number;
  _count?: { attempts?: number; rounds?: number; events?: number };
}

export interface UncleTeepediaCompetitionItem {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  format: UncleTeepediaFormat;
  gameplayMode: UncleTeepediaGameplayMode;
  status: UncleTeepediaStatus;
  joinCode: string;
  eligibilityLevel: UncleTeepediaEligibility;
  overallDurationSeconds: number;
  questionDurationSeconds?: number | null;
  answerGraceSeconds?: number;
  revealDurationSeconds?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  pointsPerCorrect: number;
  negativePoints: number;
  skipPenalty?: number;
  maxParticipants?: number | null;
  allowLateJoin?: boolean;
  allowPracticeAttempts?: boolean;
  maxPracticeAttempts?: number | null;
  showLeaderboard?: boolean;
  buzzEnabled?: boolean;
  rules?: string | null;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  questions?: UncleTeepediaQuestionItem[];
  participants?: Array<{
    id: string;
    status: string;
    cachedTotalScore: number;
    user?: { id: string; user_name: string; user_email?: string };
  }>;
  sessions?: UncleTeepediaSessionItem[];
  eligibleClasses?: Array<{ classId: string; class?: { id: string; name: string } }>;
  _count?: { questions?: number; participants?: number; sessions?: number };
}

export interface UncleTeepediaRound {
  id: string;
  roundNumber: number;
  status: string;
  startedAt?: string | null;
  answerDeadlineAt?: string | null;
  revealStartedAt?: string | null;
  revealEndsAt?: string | null;
  correctOption?: number | null;
  buzzedAttemptId?: string | null;
}

export interface UncleTeepediaLiveState {
  session: {
    id: string;
    status: string;
    competitionId: string;
    overallStartedAt?: string | null;
    overallEndsAt?: string | null;
    pausedAt?: string | null;
    currentRoundNumber?: number;
    activeParticipantId?: string | null;
    version?: number;
  };
  competition: {
    id: string;
    title: string;
    format: UncleTeepediaFormat;
    gameplayMode: UncleTeepediaGameplayMode;
    joinCode?: string;
    rules?: string | null;
    showLeaderboard?: boolean;
    allowPracticeAttempts?: boolean;
    maxPracticeAttempts?: number | null;
    overallDurationSeconds?: number;
    questionDurationSeconds?: number | null;
    revealDurationSeconds?: number;
    buzzEnabled?: boolean;
    autoAdvance?: boolean;
  };
  currentRound?: UncleTeepediaRound | null;
  question?: (UncleTeepediaQuestionItem & { correctOption?: number | null }) | null;
  participants?: UncleTeepediaParticipantItem[];
  leaderboard?: Array<{
    id: string;
    name: string;
    score: number;
    correctAnswers: number;
    totalAnswers: number;
    status?: string;
  }>;
  selectedOption?: number | null;
  answerRevealed?: boolean;
  myAnswerCorrect?: boolean | null;
  isHotSeat?: boolean;
  isActive?: boolean;
  attempt?: {
    id: string;
    kind?: 'OFFICIAL' | 'PRACTICE';
    status: string;
    currentQuestionIndex?: number;
    totalQuestions?: number;
    startedAt?: string;
    expiresAt?: string | null;
    score?: number;
  } | null;
  totalQuestions?: number;
  attemptKind?: 'OFFICIAL' | 'PRACTICE';
  follow?: {
    participant: UncleTeepediaParticipantItem;
    currentQuestionIndex: number;
    totalQuestions: number;
    question?: UncleTeepediaQuestionItem | null;
    selectedOption?: number | null;
    answerRevealed?: boolean;
    attemptStatus?: string;
    score?: number;
  } | null;
}

export interface UncleTeepediaMineItem {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  format: UncleTeepediaFormat;
  gameplayMode: UncleTeepediaGameplayMode;
  status: UncleTeepediaStatus;
  joinCode: string;
  questionCount: number;
  sessionId?: string | null;
  participant?: { id: string; status: string; cachedTotalScore: number } | null;
}

export interface PublicUncleTeepediaLiveItem {
  sessionId: string;
  status: string;
  participants: number;
  startedAt?: string | null;
  endsAt?: string | null;
  competition: {
    id: string;
    title: string;
    format: UncleTeepediaFormat;
    gameplayMode: UncleTeepediaGameplayMode;
    coverUrl?: string | null;
    showLeaderboard?: boolean;
  };
}

export const formatLabel = (format: UncleTeepediaFormat) =>
  format === 'SIXTY_SECONDS' ? '60 Seconds of Fame' : 'Multiple Choice Championship';

export const modeLabel = (mode: UncleTeepediaGameplayMode) =>
  mode === 'HOT_SEAT'
    ? 'Individual Hot Seat'
    : mode === 'SHARED_LIVE'
      ? 'Shared Live Challenge'
      : 'Self-paced MCQ';

export const statusTone = (status: string): 'amber' | 'emerald' | 'sky' | 'violet' | 'ink' | 'rose' => {
  switch (status) {
    case 'LIVE':
      return 'emerald';
    case 'PAUSED':
    case 'REVEAL':
      return 'amber';
    case 'SCHEDULED':
      return 'sky';
    case 'ENDED':
      return 'ink';
    case 'CANCELLED':
      return 'rose';
    default:
      return 'violet';
  }
};
