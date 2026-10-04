"use client"
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    Plus, PanelLeft, Sparkles, SendHorizontal, X, Loader2,
    Database, BookOpen, Trash2, MessageSquare, CheckCircle2,
    AlertCircle, Clock, ChevronDown, ChevronUp, Play,
    SkipForward, ListTodo, RefreshCw, Search, Zap, Target,
    Eye, Hash, AlertTriangle, Info
} from 'lucide-react';
import Image from 'next/image';
import {
    BiBookmark, BiBrain, BiChevronDown, BiCopy,
    BiSolidShapes
} from 'react-icons/bi';
import { FiThumbsDown, FiThumbsUp } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatDB, Message, Conversation } from '@/lib/db/chat-db';
import { openRouterService, ChatMessage } from '@/lib/services/openrouter';
import { examApi } from '@/lib/api/exams';
import { subjectApi } from '@/lib/api/subjects';
import { questionApi } from '@/lib/api/questions';
import { classApi } from '@/lib/api/classes';
import { v4 as uuidv4 } from 'uuid';
import { ScaleLoader } from 'react-spinners';
import { useSearchParams } from 'next/navigation';
import { SiGoogleclassroom } from 'react-icons/si';
import { MdQuiz } from 'react-icons/md';
import { useWorkspaceUsage } from '@/hooks/useWorkspaceUsage';

// ─── Types ─────────────────────────────────────────────────────────────────

type ActionType = 'CREATE_EXAM' | 'ADD_QUESTIONS' | 'CREATE_SUBJECT' | 'CREATE_CLASS';
type ActionStatus = 'pending' | 'confirming' | 'executing' | 'done' | 'skipped' | 'error';

interface ResolutionTrace {
    field: string;
    strategy: string;
    input: string;
    resolved: string;
    confidence: 'high' | 'medium' | 'low';
}

interface ActionItem {
    id: string;
    type: ActionType;
    data: any;
    status: ActionStatus;
    messageId?: string;
    errorMsg?: string;
    result?: any;
    order: number;
    resolutionTraces?: ResolutionTrace[];
}

const CONTEXT_OPTIONS = [
    { id: 'exams', label: 'Exams', icon: <BookOpen size={14} />, api: examApi },
    { id: 'subjects', label: 'Subjects', icon: <BiSolidShapes size={14} />, api: subjectApi },
    { id: 'questions', label: 'Questions', icon: <MdQuiz size={14} />, api: questionApi },
    { id: 'classes', label: 'Classes', icon: <SiGoogleclassroom size={14} />, api: classApi },
];

const ACTION_META: Record<ActionType, { label: string; confirmLabel: string; color: string }> = {
    CREATE_EXAM: { label: 'Create Exam', confirmLabel: 'Create Exam', color: '#3b82f6' },
    ADD_QUESTIONS: { label: 'Add Questions', confirmLabel: 'Add Questions', color: '#8b5cf6' },
    CREATE_SUBJECT: { label: 'Create Subject', confirmLabel: 'Create Subject', color: '#10b981' },
    CREATE_CLASS: { label: 'Create Class', confirmLabel: 'Create Class', color: '#f59e0b' },
};

// ─── Advanced Fuzzy Resolution Engine ──────────────────────────────────────

/**
 * Normalise a string for fuzzy comparison:
 * lowercase, strip punctuation, collapse whitespace, remove common stop-words.
 */
function normalise(s: string): string {
    return (s || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\b(the|a|an|of|for|and|or|in|on|at|to|by|is|are)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Compute Levenshtein distance */
function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
}

/** Similarity score 0..1 between two normalised strings */
function similarity(a: string, b: string): number {
    const na = normalise(a), nb = normalise(b);
    if (!na || !nb) return 0;
    if (na === nb) return 1;
    if (na.includes(nb) || nb.includes(na)) return 0.9;
    const dist = levenshtein(na, nb);
    const maxLen = Math.max(na.length, nb.length);
    return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

/** Bigram overlap */
function bigramSim(a: string, b: string): number {
    const bigrams = (s: string) => {
        const r = new Set<string>();
        for (let i = 0; i < s.length - 1; i++) r.add(s.slice(i, i + 2));
        return r;
    };
    const na = normalise(a), nb = normalise(b);
    const ba = bigrams(na), bb = bigrams(nb);
    let intersect = 0;
    ba.forEach(g => { if (bb.has(g)) intersect++; });
    return (ba.size + bb.size) === 0 ? 0 : (2 * intersect) / (ba.size + bb.size);
}

/** Token set overlap — good for "JS1 Mathematics" vs "Mathematics JS1" */
function tokenSetSim(a: string, b: string): number {
    const tokA = new Set(normalise(a).split(' ').filter(Boolean));
    const tokB = new Set(normalise(b).split(' ').filter(Boolean));
    let intersect = 0;
    tokA.forEach(t => { if (tokB.has(t)) intersect++; });
    const union = new Set([...tokA, ...tokB]).size;
    return union === 0 ? 0 : intersect / union;
}

/** Composite score — weighted average of multiple strategies */
function compositeScore(query: string, candidate: string): number {
    return (
        similarity(query, candidate) * 0.4 +
        bigramSim(query, candidate) * 0.3 +
        tokenSetSim(query, candidate) * 0.3
    );
}

interface FuzzyMatch<T> {
    item: T;
    score: number;
    strategy: string;
}

/**
 * Multi-strategy fuzzy lookup.
 * Tries exact → normalised-exact → prefix → composite fuzzy.
 * Returns the best match above the threshold, plus a confidence rating.
 */
function fuzzyFind<T extends { id: string; name?: string; exam_name?: string }>(
    candidates: T[],
    query: string,
    threshold = 0.45
): { match: T | null; score: number; strategy: string; confidence: 'high' | 'medium' | 'low' } {
    if (!query || candidates.length === 0) return { match: null, score: 0, strategy: 'none', confidence: 'low' };

    const getName = (c: T) => c.name || c.exam_name || '';
    const nq = normalise(query);

    // 1. Exact match
    const exact = candidates.find(c => getName(c).toLowerCase() === query.toLowerCase());
    if (exact) return { match: exact, score: 1, strategy: 'exact', confidence: 'high' };

    // 2. Normalised exact
    const normExact = candidates.find(c => normalise(getName(c)) === nq);
    if (normExact) return { match: normExact, score: 0.99, strategy: 'normalised-exact', confidence: 'high' };

    // 3. Contains (both ways)
    const contains = candidates.find(c => {
        const cn = normalise(getName(c));
        return cn.includes(nq) || nq.includes(cn);
    });
    if (contains) return { match: contains, score: 0.88, strategy: 'contains', confidence: 'high' };

    // 4. Token prefix — every token in query starts some token in candidate name
    const tokenPrefix = candidates.find(c => {
        const cTokens = normalise(getName(c)).split(' ');
        return nq.split(' ').filter(Boolean).every(qt =>
            cTokens.some(ct => ct.startsWith(qt) || qt.startsWith(ct))
        );
    });
    if (tokenPrefix) return { match: tokenPrefix, score: 0.85, strategy: 'token-prefix', confidence: 'high' };

    // 5. Composite fuzzy — pick best scoring candidate
    const scored = candidates
        .map(c => ({ item: c, score: compositeScore(query, getName(c)), strategy: 'composite-fuzzy' }))
        .sort((a, b) => b.score - a.score);

    const best = scored[0];
    if (best.score >= threshold) {
        const confidence: 'high' | 'medium' | 'low' =
            best.score >= 0.75 ? 'high' : best.score >= 0.55 ? 'medium' : 'low';
        return { match: best.item, score: best.score, strategy: best.strategy, confidence };
    }

    return { match: null, score: best?.score ?? 0, strategy: 'no-match', confidence: 'low' };
}

// ─── ID Resolution ──────────────────────────────────────────────────────────

interface WorkspaceData {
    classes: any[];
    exams: any[];
    subjects: any[];
}

function resolveAllIds(
    data: any,
    ws: WorkspaceData,
    previousQueueResults: ActionItem[]
): { resolved: any; traces: ResolutionTrace[] } {
    const resolved = { ...data };
    const traces: ResolutionTrace[] = [];

    const trace = (
        field: string,
        strategy: string,
        input: string,
        resolvedName: string,
        confidence: 'high' | 'medium' | 'low'
    ) => traces.push({ field, strategy, input, resolved: resolvedName, confidence });

    // ── Resolve subjectId ────────────────────────────────────────────────
    if (!resolved.subjectId && (resolved.subjectName || resolved.subject)) {
        const nameHint = resolved.subjectName || resolved.subject;
        const r = fuzzyFind(ws.subjects, nameHint);
        if (r.match) {
            resolved.subjectId = r.match.id;
            resolved.subjectName = r.match.name;
            trace('subjectId', r.strategy, nameHint, r.match.name!, r.confidence);
        }
    }

    // ── Resolve classId ──────────────────────────────────────────────────
    if (!resolved.classId && (resolved.className || resolved.class)) {
        const nameHint = resolved.className || resolved.class;
        const r = fuzzyFind(ws.classes, nameHint);
        if (r.match) {
            resolved.classId = r.match.id;
            resolved.className = r.match.name;
            trace('classId', r.strategy, nameHint, r.match.name!, r.confidence);
        }
    }

    // ── Resolve examId ───────────────────────────────────────────────────
    if (!resolved.examId || resolved.examId === 'PENDING_FROM_PREVIOUS') {
        // Strategy 1: from previous CREATE_EXAM result in queue
        const prevExam = previousQueueResults
            .filter(a => a.type === 'CREATE_EXAM' && a.status === 'done' && a.result?.id)
            .at(-1);
        if (prevExam?.result?.id) {
            resolved.examId = prevExam.result.id;
            const examRecord = ws.exams.find(e => e.id === resolved.examId);
            resolved.examName = examRecord?.exam_name || examRecord?.name || resolved.examName;
            trace('examId', 'queue-result', 'PENDING_FROM_PREVIOUS', resolved.examName || resolved.examId, 'high');
        } else if (resolved.examName || resolved.exam) {
            // Strategy 2: fuzzy match against workspace exams
            const nameHint = resolved.examName || resolved.exam;
            const r = fuzzyFind(ws.exams, nameHint);
            if (r.match) {
                resolved.examId = r.match.id;
                resolved.examName = r.match.exam_name || r.match.name;
                // Also pull classId from exam if missing
                if (!resolved.classId && r.match.classId) {
                    resolved.classId = r.match.classId;
                    const cls = ws.classes.find(c => c.id === resolved.classId);
                    if (cls) trace('classId', 'exam-lookup', r.match.exam_name || r.match.name!, cls.name!, 'high');
                }
                trace('examId', r.strategy, nameHint, resolved.examName!, r.confidence);
            }
        }
    }

    // ── If examId is now known, also resolve classId from exam ───────────
    if (resolved.examId && !resolved.classId) {
        const examRecord = ws.exams.find(e => e.id === resolved.examId);
        if (examRecord?.classId) {
            resolved.classId = examRecord.classId;
            const cls = ws.classes.find(c => c.id === resolved.classId);
            if (cls) trace('classId', 'exam-classId-lookup', resolved.examId, cls.name!, 'high');
        }
    }

    // ── Per-question subjectId / classId override (inherit from top-level if missing) ──
    if (Array.isArray(resolved.questions)) {
        resolved.questions = resolved.questions.map((q: any) => {
            const qResolved = { ...q };
            if (!qResolved.subjectId) qResolved.subjectId = resolved.subjectId;
            if (!qResolved.classId) qResolved.classId = resolved.classId;
            return qResolved;
        });
    }

    return { resolved, traces };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseActionsFromContent(content: string, messageId: string): ActionItem[] {
    const patterns: { type: ActionType; re: RegExp }[] = [
        { type: 'CREATE_CLASS', re: /\[ACTION:CREATE_CLASS\]([\s\S]*?)\[\/ACTION\]/g },
        { type: 'CREATE_SUBJECT', re: /\[ACTION:CREATE_SUBJECT\]([\s\S]*?)\[\/ACTION\]/g },
        { type: 'CREATE_EXAM', re: /\[ACTION:CREATE_EXAM\]([\s\S]*?)\[\/ACTION\]/g },
        { type: 'ADD_QUESTIONS', re: /\[ACTION:ADD_QUESTIONS\]([\s\S]*?)\[\/ACTION\]/g },
    ];

    const found: { idx: number; type: ActionType; data: any }[] = [];
    for (const { type, re } of patterns) {
        const globalRe = new RegExp(re.source, 'g');
        let m: RegExpExecArray | null;
        while ((m = globalRe.exec(content)) !== null) {
            try {
                const data = JSON.parse(m[1].trim());
                found.push({ idx: m.index, type, data });
            } catch { /* skip malformed */ }
        }
    }
    found.sort((a, b) => a.idx - b.idx);

    return found.map((f, i) => ({
        id: uuidv4(),
        type: f.type,
        data: f.data,
        status: 'pending',
        messageId,
        order: i,
        resolutionTraces: [],
    }));
}

// ─── Main Component ─────────────────────────────────────────────────────────

const ChatInterface = () => {
    const [user, setUser] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [selectedContext, setSelectedContext] = useState<string[]>([]);
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [selectedModel, setSelectedModel] = useState('qwen/qwen-2.5-7b-instruct');
    const [currentConversationId, setCurrentConversationId] = useState<string>(uuidv4());

    const [actionQueue, setActionQueue] = useState<ActionItem[]>([]);
    const [activeActionIdx, setActiveActionIdx] = useState<number>(-1);
    const [isExecutingAction, setIsExecutingAction] = useState(false);
    const [showPlanPanel, setShowPlanPanel] = useState(false);
    const [editableAction, setEditableAction] = useState<ActionItem | null>(null);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [availableClasses, setAvailableClasses] = useState<any[]>([]);
    const [availableExams, setAvailableExams] = useState<any[]>([]);
    const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
    const [showThinking, setShowThinking] = useState<Record<string, boolean>>({});

    const searchParams = useSearchParams();
    const initialQueryProcessed = useRef(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const queueRef = useRef<ActionItem[]>([]);
    const activeIdxRef = useRef<number>(-1);
    const wsRef = useRef<WorkspaceData>({ classes: [], exams: [], subjects: [] });

    useEffect(() => { queueRef.current = actionQueue; }, [actionQueue]);
    useEffect(() => { activeIdxRef.current = activeActionIdx; }, [activeActionIdx]);
    useEffect(() => {
        wsRef.current = { classes: availableClasses, exams: availableExams, subjects: availableSubjects };
    }, [availableClasses, availableExams, availableSubjects]);
    
    const { data: usageData } = useWorkspaceUsage();
    const isAICreditReached = usageData ? usageData.usage.aiCredits >= usageData.limits.aiCredits : false;
    const isExamLimitReached = usageData ? usageData.usage.exams >= usageData.limits.exams : false;

    // ── Init ──────────────────────────────────────────────────────────────

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const storedUser = window.localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
                const wId = parsed.workspaceId;
                if (wId) {
                    classApi.list(wId).then(r => { if (r.success && r.data) setAvailableClasses(r.data); });
                    examApi.list({ workspaceId: wId }).then(r => { if (r.success && r.data) setAvailableExams(r.data); });
                    subjectApi.list(wId).then(r => { if (r.success && r.data) setAvailableSubjects(r.data); });
                }
            } catch { /* ignore */ }
        }
        loadConversations();
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages]);

    useEffect(() => {
        const q = searchParams.get('q');
        if (q && !initialQueryProcessed.current) {
            initialQueryProcessed.current = true;
            setTimeout(() => handleSendMessage(q), 500);
        }
    }, [searchParams]);

    // Whenever activeActionIdx changes and points to a confirming action, populate editableAction
    useEffect(() => {
        if (activeActionIdx >= 0 && activeActionIdx < actionQueue.length) {
            const action = actionQueue[activeActionIdx];
            if (action.status === 'confirming') {
                // Run full resolution with current workspace data
                const previous = queueRef.current.slice(0, activeActionIdx);
                const { resolved, traces } = resolveAllIds(action.data, wsRef.current, previous);
                const enriched: ActionItem = {
                    ...JSON.parse(JSON.stringify(action)),
                    data: resolved,
                    resolutionTraces: traces,
                };
                setEditableAction(enriched);
                setShowPlanPanel(true);
            }
        }
    }, [activeActionIdx, actionQueue]);

    // ── Conversation helpers ──────────────────────────────────────────────

    const loadConversations = async () => {
        const history = await chatDB.getConversations();
        setConversations(history);
        if (history.length > 0) loadMessages(history[0].id);
    };

    const loadMessages = async (id: string) => {
        setCurrentConversationId(id);
        const msgs = await chatDB.getMessages(id);
        setMessages(msgs);
        setActionQueue([]);
        setActiveActionIdx(-1);
        setEditableAction(null);
        setShowPlanPanel(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // ── Input helpers ─────────────────────────────────────────────────────

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInputText(value);
        if (value.endsWith('@')) setShowMentionDropdown(true);
        else if (!value.includes('@')) setShowMentionDropdown(false);
    };

    const addContext = (id: string) => {
        if (!selectedContext.includes(id)) setSelectedContext(prev => [...prev, id]);
        setInputText(t => t.replace(/@$/, ''));
        setShowMentionDropdown(false);
        inputRef.current?.focus();
    };

    const removeContext = (id: string) => setSelectedContext(prev => prev.filter(c => c !== id));

    // ── Workspace helpers ─────────────────────────────────────────────────

    const getWorkspaceId = (): string => {
        if (user?.workspaceId) return user.workspaceId;
        try {
            const u = localStorage.getItem('user');
            if (u) return JSON.parse(u).workspaceId || '';
        } catch { /* */ }
        return '';
    };

    const getContextData = async () => {
        const workspaceId = getWorkspaceId();
        const payload: any[] = [];
        for (const ctxId of selectedContext) {
            const opt = CONTEXT_OPTIONS.find(o => o.id === ctxId);
            if (!opt) continue;
            try {
                const r = await opt.api.list(workspaceId);
                if (r.success) payload.push({ type: ctxId, data: r?.data?.slice(0, 5) });
            } catch { /* */ }
        }
        return payload;
    };

    const refreshWorkspaceData = async () => {
        const wId = getWorkspaceId();
        if (!wId) return;
        const [examsRes, classesRes, subjectsRes] = await Promise.all([
            examApi.list({ workspaceId: wId }),
            classApi.list(wId),
            subjectApi.list(wId),
        ]);
        if (examsRes.success && examsRes.data) setAvailableExams(examsRes.data);
        if (classesRes.success && classesRes.data) setAvailableClasses(classesRes.data);
        if (subjectsRes.success && subjectsRes.data) setAvailableSubjects(subjectsRes.data);
    };

    // ── Queue management helpers ──────────────────────────────────────────

    const updateAction = (id: string, patch: Partial<ActionItem>) => {
        setActionQueue(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
    };

    const advanceQueue = useCallback(async (queue: ActionItem[], fromIdx: number) => {
        const nextIdx = fromIdx + 1;
        if (nextIdx >= queue.length) {
            setActiveActionIdx(-1);
            setEditableAction(null);
            setShowPlanPanel(false);
            return;
        }
        const next = queue[nextIdx];
        setActiveActionIdx(nextIdx);
        setActionQueue(prev => prev.map((a, i) => i === nextIdx ? { ...a, status: 'confirming' } : a));
    }, []);

    // ── Core: execute a single confirmed action ───────────────────────────

    const executeAction = async (action: ActionItem): Promise<{ success: boolean; result?: any; errorMsg?: string }> => {
        const workspaceId = getWorkspaceId();
        if (!workspaceId) return { success: false, errorMsg: 'No workspace found. Please log in again.' };

        const data = action.data;

        try {
            if (action.type === 'CREATE_CLASS') {
                const res = await classApi.create({ name: data.name, workspaceId });
                if (!res.success) return { success: false, errorMsg: (res as any).message };
                await classApi.list(workspaceId).then(r => { if (r.success && r.data) setAvailableClasses(r.data); });
                return { success: true, result: res.data };
            }

            if (action.type === 'CREATE_SUBJECT') {
                const res = await subjectApi.create({ name: data.name, workspaceId });
                if (!res.success) return { success: false, errorMsg: (res as any).message };
                await subjectApi.list(workspaceId).then(r => { if (r.success && r.data) setAvailableSubjects(r.data); });
                return { success: true, result: res.data };
            }

            if (action.type === 'CREATE_EXAM') {
                if (isExamLimitReached) return { success: false, errorMsg: 'Exam limit reached for your current plan. Please upgrade to create more exams.' };
                if (!data.classId) return { success: false, errorMsg: 'A class must be selected.' };
                const examName = data.exam_name || data.name;
                const res = await examApi.create({
                    exam_name: examName,
                    minutes: Number(data.minutes) || 60,
                    workspaceId,
                    classId: data.classId,
                    visible: true,
                });
                if (!res.success) return { success: false, errorMsg: (res as any).message };
                const freshExams = await examApi.list({ workspaceId });
                if (freshExams.success && freshExams.data) setAvailableExams(freshExams.data);
                return { success: true, result: res.data };
            }

            if (action.type === 'ADD_QUESTIONS') {
                let { examId, subjectId, classId, questions = [] } = data;

                // Final fallback resolution with freshest workspace data
                if (!examId || examId === 'PENDING_FROM_PREVIOUS') {
                    const prevExamAction = queueRef.current
                        .filter(a => a.type === 'CREATE_EXAM' && a.status === 'done' && a.result)
                        .at(-1);
                    if (prevExamAction?.result?.id) examId = prevExamAction.result.id;
                    else if (data.examName) {
                        const r = fuzzyFind(wsRef.current.exams, data.examName);
                        if (r.match) examId = r.match.id;
                    }
                }

                if (!examId) return { success: false, errorMsg: 'Target exam could not be resolved. Please select one manually.' };
                if (!subjectId) return { success: false, errorMsg: 'Subject must be selected.' };

                if (!classId) {
                    const examRecord = wsRef.current.exams.find(e => e.id === examId);
                    if (examRecord) classId = examRecord.classId;
                }

                let added = 0;
                for (const q of questions) {
                    const correctAnswer = q.correct_answer || q.answer || q.correctAnswer;
                    const incorrectAnswers = q.incorrect_answers || q.incorrectAnswers ||
                        (q.options || []).filter((o: string) => o !== correctAnswer);

                    const res = await questionApi.create({
                        workspaceId,
                        examId,
                        subjectId: q.subjectId || subjectId,
                        classId: q.classId || classId,
                        type: q.type || 'MULTIPLE_CHOICE',
                        question: q.question || q.text,
                        correct_answer: correctAnswer,
                        author: 'LearningDeck AI Agent',
                        incorrect_answers:
                            (q.type === 'MULTIPLE_CHOICE' || !q.type) && Array.isArray(incorrectAnswers)
                                ? incorrectAnswers.filter((a: any) => a && String(a).trim() !== '')
                                : [],
                        explanation: q.explanation || undefined,
                    });
                    if (res.success) added++;
                    else console.error('Failed to add question:', res, q);
                    await new Promise(r => setTimeout(r, 100));
                }
                return { success: true, result: { added, total: questions.length } };
            }

            return { success: false, errorMsg: 'Unknown action type.' };
        } catch (e: any) {
            return { success: false, errorMsg: e?.message || 'Unexpected error' };
        }
    };

    // ── Handle user clicking "Confirm" ────────────────────────────────────

    const handleConfirmAction = async () => {
        if (!editableAction || isExecutingAction) return;
        const idx = activeIdxRef.current;

        setIsExecutingAction(true);
        updateAction(editableAction.id, { status: 'executing', data: editableAction.data });

        const outcome = await executeAction({ ...editableAction });

        if (!outcome.success) {
            updateAction(editableAction.id, { status: 'error', errorMsg: outcome.errorMsg });
            setIsExecutingAction(false);
            return;
        }

        updateAction(editableAction.id, { status: 'done', result: outcome.result });

        const confirmMsgs: Record<ActionType, (d: any, r: any) => string> = {
            CREATE_EXAM: (d, _) => `✅ Exam **${d.exam_name || d.name}** created successfully.`,
            ADD_QUESTIONS: (d, r) => `✅ Added **${r.added}/${r.total}** questions to **${d.examName || 'exam'}**.`,
            CREATE_SUBJECT: (d, _) => `✅ Subject **${d.name}** created successfully.`,
            CREATE_CLASS: (d, _) => `✅ Class **${d.name}** created successfully.`,
        };
        await addSystemMessage(confirmMsgs[editableAction.type](editableAction.data, outcome.result));
        if (editableAction.messageId) updateTaskStatus(editableAction.messageId);

        setIsExecutingAction(false);
        setEditableAction(null);

        // Refresh workspace so next action in queue has fresh data
        await refreshWorkspaceData();

        const currentQueue = queueRef.current;
        await advanceQueue(currentQueue, idx);
    };

    const handleSkipAction = async () => {
        if (!editableAction) return;
        const idx = activeIdxRef.current;
        updateAction(editableAction.id, { status: 'skipped' });
        setEditableAction(null);
        await advanceQueue(queueRef.current, idx);
    };

    const handleRetryAction = () => {
        if (!editableAction) return;
        // Re-run resolution with fresh workspace data
        const previous = queueRef.current.slice(0, activeIdxRef.current);
        const { resolved, traces } = resolveAllIds(editableAction.data, wsRef.current, previous);
        setEditableAction(prev => prev ? { ...prev, data: resolved, resolutionTraces: traces, errorMsg: undefined, status: 'confirming' } : prev);
        updateAction(editableAction.id, { status: 'confirming', errorMsg: undefined });
    };

    // ── Send message ──────────────────────────────────────────────────────

    const handleSendMessage = async (overrideText?: string) => {
        if (isAICreditReached) {
            await addSystemMessage('⚠️ AI Credit limit reached for your current plan. Please upgrade to continue using Agentic Mode.');
            return;
        }
        const textToSend = overrideText || inputText;
        if (!textToSend.trim() && selectedContext.length === 0) return;

        setActionQueue([]);
        setActiveActionIdx(-1);
        setEditableAction(null);
        setShowPlanPanel(false);

        const userMsg: Message = {
            id: uuidv4(),
            conversationId: currentConversationId,
            role: 'user',
            content: textToSend,
            timestamp: Date.now(),
            context: selectedContext,
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setSelectedContext([]);
        setIsStreaming(true);
        await chatDB.saveMessage(userMsg);

        if (messages.length === 0) {
            const newConv: Conversation = {
                id: currentConversationId,
                title: textToSend.substring(0, 40) || 'New Chat',
                timestamp: Date.now(),
            };
            await chatDB.saveConversation(newConv);
            setConversations(prev => [newConv, ...prev]);
        }

        const contextData = await getContextData();
        const workspaceCtx = {
            classes: availableClasses.map(c => ({ id: c.id, name: c.name })),
            exams: availableExams.map(e => ({ id: e.id, name: e.exam_name || e.name, classId: e.classId })),
            subjects: availableSubjects.map(s => ({ id: s.id, name: s.name })),
            mentionedData: contextData,
        };

        const aiMessages: ChatMessage[] = [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            {
                role: 'user',
                content: `${userMsg.content}\n\n<workspace_context>${JSON.stringify(workspaceCtx)}</workspace_context>`,
            },
        ];

        let aiContent = '';
        const aiMsgId = uuidv4();
        const workspaceId = getWorkspaceId();

        await openRouterService.streamChat(
            workspaceId,
            aiMessages,
            (chunk) => {
                aiContent += chunk;
                setMessages(prev => {
                    const existing = prev.find(m => m.id === aiMsgId);
                    if (existing) return prev.map(m => m.id === aiMsgId ? { ...m, content: aiContent } : m);
                    return [...prev, {
                        id: aiMsgId,
                        conversationId: currentConversationId,
                        role: 'assistant',
                        content: aiContent,
                        timestamp: Date.now(),
                    }];
                });
            },
            selectedModel,
        );

        setIsStreaming(false);

        // ── Parse actions & resolve IDs immediately ──────────────────────
        const rawActions = parseActionsFromContent(aiContent, aiMsgId);

        if (rawActions.length > 0) {
            const ws = wsRef.current;

            // Pre-resolve all actions (pass empty previous results for now)
            const preResolved: ActionItem[] = rawActions.map((a, i) => {
                if (a.type === 'ADD_QUESTIONS') {
                    const { resolved, traces } = resolveAllIds(a.data, ws, []);
                    return { ...a, data: resolved, resolutionTraces: traces };
                }
                return a;
            });

            setActionQueue(preResolved.map((a, i) => ({
                ...a,
                status: i === 0 ? 'confirming' : 'pending',
            })));
            setActiveActionIdx(0);
            setShowPlanPanel(true);
        }

        await chatDB.saveMessage({
            id: aiMsgId,
            conversationId: currentConversationId,
            role: 'assistant',
            content: aiContent,
            timestamp: Date.now(),
        });
    };

    // ── Helpers used inside message rendering ─────────────────────────────

    const addSystemMessage = async (content: string) => {
        const msg: Message = {
            id: uuidv4(),
            conversationId: currentConversationId,
            role: 'assistant',
            content,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, msg]);
        await chatDB.saveMessage(msg);
    };

    const updateTaskStatus = (msgId: string) => {
        setMessages(prev => prev.map(m => {
            if (m.id !== msgId) return m;
            let c = m.content;
            if (/\[\s*\/\s*\]/.test(c)) c = c.replace(/\[\s*\/\s*\]/, '[x]');
            if (/\[\s+\]/.test(c)) c = c.replace(/\[\s+\]/, '[/]');
            if (c !== m.content) { chatDB.saveMessage({ ...m, content: c }); return { ...m, content: c }; }
            return m;
        }));
    };

    const startNewChat = () => {
        setCurrentConversationId(uuidv4());
        setMessages([]);
        setActionQueue([]);
        setActiveActionIdx(-1);
        setEditableAction(null);
        setShowPlanPanel(false);
    };

    // ── Derived ───────────────────────────────────────────────────────────

    const userName = user?.user_name || 'User';
    const firstLetter = userName.charAt(0).toUpperCase();
    const activeAction = editableAction;
    const queueHasItems = actionQueue.length > 0;
    const doneCount = actionQueue.filter(a => a.status === 'done' || a.status === 'skipped').length;
    const allDone = queueHasItems && doneCount === actionQueue.length;

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <div className="flex h-full w-full bg-white text-[#6b6b6b] font-sans overflow-hidden relative">

            {/* ── Sidebar ──────────────────────────────────────────────────── */}
            <aside className={`flex flex-col border-r border-[#ededed]  transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'}`}>
                <div className="p-4 border-b border-[#ededed] ">
                    <button
                        onClick={startNewChat}
                        disabled={isAICreditReached}
                        className={`w-full flex items-center justify-center gap-2 border border-[#ededed] rounded py-2 transition-colors font-medium ${
                            isAICreditReached 
                                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' 
                                : 'text-[#1a1a1a] hover:border-blue-400 hover:text-blue-500 bg-[#f9f9f9]'
                        }`}
                        title={isAICreditReached ? "AI Credit limit reached" : "Start New Chat"}
                    >
                        <Plus size={14} /> New Chat
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                    {conversations.length === 0 ? (
                        <p className="text-xs text-center text-[#6b6b6b]/50 mt-6 px-4">No conversations yet</p>
                    ) : conversations.map(conv => (
                        <div
                            key={conv.id}
                            onClick={() => loadMessages(conv.id)}
                            className={`flex items-center justify-between gap-2 px-3 py-2 rounded cursor-pointer group transition-colors  ${currentConversationId === conv.id
                                ? 'bg-blue-500/10 text-blue-500'
                                : 'text-[#6b6b6b] hover:bg-[#f9f9f9] hover:text-[#1a1a1a]'
                                }`}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <MessageSquare size={13} className="shrink-0 opacity-60" />
                                <span className="truncate">{conv.title}</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); chatDB.deleteConversation(conv.id).then(loadConversations); }}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all shrink-0"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* ── Main Panel ───────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col relative min-w-0 ">

                {/* Header */}
                <header className="flex items-center justify-between px-5 py-3 border-b border-[#ededed]  z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 border border-[#ededed] bg-[#f9f9f9] rounded hover:border-blue-300 transition-colors group relative">
                            <div className="p-1 bg-[#f0f0f0] rounded group-hover:bg-blue-500/10 transition-colors">
                                <BiBrain size={14} className="text-blue-500" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="text-[#1a1a1a]  font-medium">Agentic Mode</span>
                            </div>
                            <div className="h-4 w-px bg-[#ededed] mx-1" />
                            <select
                                value={selectedModel}
                                onChange={e => setSelectedModel(e.target.value)}
                                className="appearance-none bg-transparent text-xs text-[#6b6b6b] outline-none cursor-pointer pr-4"
                            >
                                <option value="qwen/qwen-2.5-7b-instruct">Qwen 2.5 7B</option>
                                <option value="baidu/cobuddy:free">Cobuddy (Free)</option>
                                <option value="inclusionai/ring-2.6-1t:free">Ring 2.6 (Free)</option>
                                <option value="poolside/laguna-m.1:free">Poolside (Free)</option>
                                <option value="liquid/lfm-2.5-1.2b-instruct:free">Liquid LFM (Free)</option>
                            </select>
                            <BiChevronDown size={13} className="text-[#6b6b6b] absolute right-2 pointer-events-none" />
                        </div>

                        {queueHasItems && !allDone && (
                            <button
                                onClick={() => setShowPlanPanel(v => !v)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-blue-300 bg-blue-500/10 text-blue-600 text-xs font-medium hover:bg-blue-500/20 transition-colors"
                            >
                                <ListTodo size={13} />
                                Plan · {doneCount}/{actionQueue.length}
                                {showPlanPanel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={refreshWorkspaceData}
                            className="p-1.5 rounded hover:bg-[#f0f0f0] text-[#6b6b6b] transition-colors"
                            title="Refresh workspace data"
                        >
                            <RefreshCw size={15} />
                        </button>
                        <button
                            onClick={() => setSidebarOpen(v => !v)}
                            className="p-1.5 rounded hover:bg-[#f0f0f0] text-[#6b6b6b] transition-colors"
                        >
                            <PanelLeft size={16} />
                        </button>
                    </div>
                </header>

                {/* ── Plan Panel ── */}
                {queueHasItems && showPlanPanel && (
                    <div className="border-b border-[#ededed] bg-[#fafafa] px-6 py-3">
                        <div className="max-w-3xl mx-auto">
                            <p className="text-[10px] font-semibold text-[#a0a0a0] uppercase tracking-widest mb-2.5">Execution Plan</p>
                            <div className="flex flex-wrap gap-2">
                                {actionQueue.map((a, i) => {
                                    const meta = ACTION_META[a.type];
                                    const isActive = i === activeActionIdx;
                                    const statusIcon = {
                                        done: <CheckCircle2 size={11} className="text-green-500" />,
                                        error: <AlertCircle size={11} className="text-red-400" />,
                                        executing: <Loader2 size={11} className="animate-spin text-blue-500" />,
                                        confirming: <Sparkles size={11} className="text-blue-500" />,
                                        skipped: <SkipForward size={11} className="text-[#a0a0a0]" />,
                                        pending: <Clock size={11} className="text-[#c0c0c0]" />,
                                    }[a.status];

                                    return (
                                        <div
                                            key={a.id}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${isActive
                                                ? 'border-blue-300 bg-blue-500/10 text-blue-600 shadow'
                                                : a.status === 'done'
                                                    ? 'border-green-200 bg-green-50 text-green-700 opacity-70'
                                                    : a.status === 'error'
                                                        ? 'border-red-200 bg-red-50 text-red-500'
                                                        : 'border-[#ededed] bg-white text-[#9b9b9b]'
                                                }`}
                                        >
                                            <span className="opacity-60 text-[9px]">{i + 1}</span>
                                            {statusIcon}
                                            <span>{meta.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat Area */}
                <main className="flex-1 overflow-y-auto max-h-[60vh] scrollbar-hide">
                    <div className=" mx-auto px-6 py-8 space-y-6">
                        {messages.length === 0 ? (
                            <div className="h-[55vh] flex flex-col items-center justify-center text-center space-y-6">
                                <div className="p-4 bg-[#f0f0f0] rounded-full">
                                    <Image src="https://avatars.githubusercontent.com/u/225484805?s=200&v=4" alt="LearningDeck" width={30} height={30} className="rounded-full" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-lg font-medium text-[#1a1a1a]">How can I help you today?</h2>
                                    <p className="text-[#6b6b6b] max-w-md mx-auto ">
                                        Type <code className="bg-[#f0f0f0] px-1.5 py-0.5 rounded text-blue-500 font-mono text-xs">@</code> to inject workspace context, then describe any multi-step task.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 w-full max-w-lg mt-4">
                                    {[
                                        'Create a science exam for Grade 10 with 5 questions',
                                        'Create a new subject called Mathematics',
                                        'Draft 10 biology questions for the Mid-Term exam',
                                        'Create a class called Grade 11A then add an exam',
                                    ].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setInputText(s)}
                                            className="p-4 bg-[#f9f9f9] border border-[#ededed] rounded  text-[#6b6b6b] hover:border-blue-300 hover:text-blue-500 transition-colors text-left"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-3 group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded flex items-center justify-center shrink-0">
                                        <Image src="https://avatars.githubusercontent.com/u/225484805?s=200&v=4" alt="AI" width={28} height={28} className="rounded-full" />
                                    </div>
                                )}

                                <div className={`max-w-[82%] space-y-1.5 ${msg.role === 'user' ? 'order-1' : ''}`}>
                                    <div className={`px-4 py-3 rounded leading-relaxed  ${msg.role === 'user'
                                        ? 'bg-[#f9f9f9] text-black rounded-tr-none'
                                        : 'bg-white border border-[#ededed] text-[#3a3a3a] rounded-tl-none'
                                        }`}>
                                        <div className="prose prose-sm max-w-none">

                                            {msg.role === 'assistant' && msg.content.includes('<thinking>') && (() => {
                                                const thinking = msg.content.match(/<thinking>([\s\S]*?)<\/thinking>/)?.[1] || '';
                                                const isOpen = showThinking[msg.id];
                                                return (
                                                    <div className="mb-3 border border-[#ededed] rounded overflow-hidden">
                                                        <button
                                                            onClick={() => setShowThinking(prev => ({ ...prev, [msg.id]: !isOpen }))}
                                                            className="w-full flex items-center justify-between px-3 py-2 bg-[#f9f9f9] hover:bg-[#f5f5f5] transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-[#a1a1a1] uppercase tracking-wider">
                                                                <BiBrain size={12} className="text-blue-400" />
                                                                Reasoning
                                                            </div>
                                                            {isOpen ? <ChevronUp size={12} className="text-[#a0a0a0]" /> : <ChevronDown size={12} className="text-[#a0a0a0]" />}
                                                        </button>
                                                        {isOpen && (
                                                            <div className="px-3 py-2.5 text-xs text-[#6b6b6b] italic leading-relaxed border-t border-[#ededed] bg-white">
                                                                {thinking}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {msg.role === 'assistant' && msg.content.includes('<task_list>') && (() => {
                                                const raw = msg.content.match(/<task_list>([\s\S]*?)<\/task_list>/)?.[1] || '';
                                                return (
                                                    <div className="mb-4 space-y-1.5 p-3 bg-[#f9f9f9] rounded border border-[#ededed]">
                                                        <p className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-widest mb-2">Task Plan</p>
                                                        {raw.split('\n').filter(t => t.trim()).map((task, i) => {
                                                            const isDone = /\[x\]/i.test(task);
                                                            const isDoing = /\[\/\]/.test(task);
                                                            return (
                                                                <div key={i} className="flex items-center gap-2.5 text-xs text-[#6b6b6b]">
                                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isDone ? 'bg-green-500 border-green-500 text-white'
                                                                        : isDoing ? 'border-blue-500 bg-blue-500/10'
                                                                            : 'border-[#ededed] bg-white'
                                                                        }`}>
                                                                        {isDone && <CheckCircle2 size={10} className="text-white" />}
                                                                        {isDoing && <Loader2 size={10} className="animate-spin text-blue-500" />}
                                                                    </div>
                                                                    <span className={isDone ? 'line-through opacity-50' : ''}>
                                                                        {task.replace(/\[.\]|\[\s\]/, '').trim()}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}

                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content
                                                    .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
                                                    .replace(/<task_list>[\s\S]*?<\/task_list>/g, '')
                                                    .replace(/\[ACTION:[\w_]+\][\s\S]*?\[\/ACTION\]/g, '')
                                                    .trim()}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    {msg.role === 'assistant' && (
                                        <div className="flex items-center gap-3 pl-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-[#6b6b6b] hover:text-blue-500 transition-colors"><BiCopy size={14} /></button>
                                            <button className="text-[#6b6b6b] hover:text-blue-500 transition-colors"><FiThumbsUp size={14} /></button>
                                            <button className="text-[#6b6b6b] hover:text-blue-500 transition-colors"><FiThumbsDown size={14} /></button>
                                            <button className="text-[#6b6b6b] hover:text-blue-500 transition-colors"><BiBookmark size={14} /></button>
                                        </div>
                                    )}
                                </div>

                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded bg-blue-500 rounded-full text-white flex items-center justify-center text-[#1a1a1a] text-xs font-bold border border-[#ededed] order-2 shrink-0">
                                        {firstLetter}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isStreaming && (
                            <div className="flex items-center gap-2 text-xs text-[#a0a0a0] italic px-2">
                                <ScaleLoader barCount={3} color="#a7a7a7" height={12} width={4} />
                                Thinking…
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </main>

                {/* ── Action Confirmation Panel ─────────────────────────────── */}
                {activeAction && activeAction.status === 'confirming' && !isExecutingAction && (
                    <ActionConfirmPanel
                        action={activeAction}
                        queueLength={actionQueue.length}
                        activeIdx={activeActionIdx}
                        isExecuting={isExecutingAction}
                        availableClasses={availableClasses}
                        availableExams={availableExams}
                        availableSubjects={availableSubjects}
                        onDataChange={(patch) => setEditableAction(prev => prev ? { ...prev, data: { ...prev.data, ...patch } } : prev)}
                        onConfirm={handleConfirmAction}
                        onSkip={handleSkipAction}
                        onClose={() => { setEditableAction(null); setShowPlanPanel(false); }}
                    />
                )}

                {/* Executing overlay */}
                {isExecutingAction && activeAction && (
                    <div className="absolute inset-x-0 bottom-36 z-30 mx-auto max-w-2xl px-6">
                        <div className="bg-white border border-blue-200 rounded p-5 shadow flex items-center gap-4">
                            <div className="p-2.5 bg-blue-500/10 rounded">
                                <Loader2 size={18} className="animate-spin text-blue-500" />
                            </div>
                            <div>
                                <p className=" font-semibold text-[#1a1a1a]">
                                    Executing: {ACTION_META[activeAction.type].label}
                                </p>
                                <p className="text-xs text-[#6b6b6b] mt-0.5">
                                    Step {activeActionIdx + 1} of {actionQueue.length} — please wait…
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error state */}
                {!isExecutingAction && activeAction && activeAction.status === 'error' && (
                    <div className="absolute inset-x-0 bottom-36 z-30 mx-auto max-w-2xl px-6">
                        <div className="bg-white border border-red-200 rounded p-5 shadow">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="p-2 bg-red-50 rounded"><AlertCircle size={16} className="text-red-400" /></div>
                                <div>
                                    <p className=" font-semibold text-[#1a1a1a]">Action failed</p>
                                    <p className="text-xs text-red-500 mt-0.5">{activeAction.errorMsg}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button onClick={handleSkipAction} className="px-4 py-2 text-xs text-[#6b6b6b] hover:text-[#1a1a1a] border border-[#ededed] rounded">
                                    Skip
                                </button>
                                <button onClick={handleRetryAction} className="px-4 py-2 text-xs bg-blue-500/10 text-blue-500 border border-blue-300 rounded flex items-center gap-1.5 font-medium">
                                    <RefreshCw size={12} /> Retry
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Input ─────────────────────────────────────────────────── */}
                <footer className="px-6 py-5 border-t border-[#ededed] bg-[#f9f9f9] relative z-10">
                    <div className="max-w-3xl mx-auto relative">

                        {showMentionDropdown && (
                            <div className="absolute bottom-full left-0 mb-3 w-56 py-2 bg-white border border-[#ededed] rounded shadow overflow-hidden">
                                {CONTEXT_OPTIONS.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => addContext(opt.id)}
                                        className="w-full flex items-center gap-3 px-4 py-1.5 hover:bg-[#fcfcfc] text-[#6b6b6b] hover:text-blue-500 text-xs transition-colors"
                                    >
                                        <div className="p-1 bg-[#f0f0f0] rounded text-blue-500">{opt.icon}</div>
                                        <span>{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="bg-white border border-[#ededed] rounded focus-within:border-blue-400 transition-colors overflow-hidden">
                            {selectedContext.length > 0 && (
                                <div className="flex flex-wrap gap-2 px-4 pt-3">
                                    {selectedContext.map(ctx => (
                                        <div key={ctx} className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full px-2.5 py-0.5 text-xs font-medium">
                                            <span>{CONTEXT_OPTIONS.find(o => o.id === ctx)?.label}</span>
                                            <button onClick={() => removeContext(ctx)} className="hover:opacity-70"><X size={11} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <textarea
                                ref={inputRef}
                                value={inputText}
                                onChange={handleInput}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                placeholder="Type @ to add context or describe a multi-step task…"
                                className="w-full min-h-[72px] max-h-[260px] bg-transparent text-[#1a1a1a]  leading-relaxed p-4 outline-none resize-none placeholder:text-[#6b6b6b]/50"
                                rows={1}
                            />

                            <div className="flex items-center justify-between px-4 pb-3">
                                <div className="flex items-center gap-1">
                                    <button className="p-1.5 text-[#6b6b6b] hover:text-blue-500 hover:bg-[#f0f0f0] rounded transition-colors">
                                        <Plus size={16} />
                                    </button>
                                    <button className="p-1.5 text-[#6b6b6b] hover:text-blue-500 hover:bg-[#f0f0f0] rounded transition-colors">
                                        <Database size={16} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    {isStreaming && (
                                        <div className="flex items-center gap-1.5 text-blue-500 text-xs font-medium bg-blue-500/10 px-3 py-1 rounded-full">
                                            <Loader2 size={11} className="animate-spin" /> Thinking…
                                        </div>
                                    )}
                                    <button
                                        disabled={isStreaming || isAICreditReached || (!inputText && selectedContext.length === 0)}
                                        onClick={() => handleSendMessage()}
                                        className={`py-2 px-4 rounded  font-medium transition-colors ${
                                            (inputText || selectedContext.length > 0) && !isAICreditReached && !isStreaming
                                            ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                                            : 'bg-[#f0f0f0] text-[#6b6b6b]/40 cursor-not-allowed'
                                            }`}
                                        title={isAICreditReached ? "AI Credit limit reached" : "Send Message"}
                                    >
                                        <SendHorizontal size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

// ─── Action Confirm Panel ─────────────────────────────────────────────────────

interface ConfirmPanelProps {
    action: ActionItem;
    queueLength: number;
    activeIdx: number;
    isExecuting: boolean;
    availableClasses: any[];
    availableExams: any[];
    availableSubjects: any[];
    onDataChange: (patch: any) => void;
    onConfirm: () => void;
    onSkip: () => void;
    onClose: () => void;
}

// Small chip showing how a field was resolved
const ResolutionBadge: React.FC<{ trace: ResolutionTrace }> = ({ trace }) => {
    const colors: Record<string, string> = {
        high: 'bg-green-50 text-green-600 border-green-200',
        medium: 'bg-amber-50 text-amber-600 border-amber-200',
        low: 'bg-red-50 text-red-500 border-red-200',
    };
    const icons: Record<string, React.ReactNode> = {
        'exact': <Target size={9} />,
        'normalised-exact': <Target size={9} />,
        'contains': <Search size={9} />,
        'token-prefix': <Search size={9} />,
        'composite-fuzzy': <Zap size={9} />,
        'queue-result': <CheckCircle2 size={9} />,
        'exam-lookup': <Hash size={9} />,
        'exam-classId-lookup': <Hash size={9} />,
    };
    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold ${colors[trace.confidence]}`}>
            {icons[trace.strategy] || <Zap size={9} />}
            {trace.strategy.replace(/-/g, ' ')} · {Math.round(
                trace.confidence === 'high' ? 95 : trace.confidence === 'medium' ? 72 : 50
            )}%
        </span>
    );
};

const ActionConfirmPanel: React.FC<ConfirmPanelProps> = ({
    action, queueLength, activeIdx, isExecuting,
    availableClasses, availableExams, availableSubjects,
    onDataChange, onConfirm, onSkip, onClose,
}) => {
    const meta = ACTION_META[action.type];
    const d = action.data;
    const traces = action.resolutionTraces || [];
    const [showResolution, setShowResolution] = useState(false);
    const [questionPreviewIdx, setQuestionPreviewIdx] = useState<number | null>(null);

    const fieldClass = "w-full border border-[#ededed] rounded py-2 px-3  text-[#1a1a1a] outline-none focus:border-blue-400 transition-colors";
    const labelClass = "text-[10px] font-bold text-[#a0a0a0] uppercase tracking-widest";

    // Resolved fields for display
    const resolvedExam = availableExams.find(e => e.id === d.examId);
    const resolvedSubject = availableSubjects.find(s => s.id === d.subjectId);
    const resolvedClass = availableClasses.find(c => c.id === d.classId);

    // Warnings
    const warnings: string[] = [];
    if (action.type === 'ADD_QUESTIONS') {
        if (!d.examId) warnings.push('No exam resolved — please select one manually');
        if (!d.subjectId) warnings.push('No subject resolved — please select one manually');
        const qs: any[] = d.questions || [];
        const missingCorrect = qs.filter(q => !q.correct_answer && !q.answer && !q.correctAnswer).length;
        if (missingCorrect > 0) warnings.push(`${missingCorrect} question(s) missing a correct answer`);
    }

    return (
        <div className="absolute inset-x-0 bottom-[90px] z-30 mx-auto max-w-2xl px-6">
            <div className="bg-white border border-[#ededed] rounded shadow overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#ededed] bg-[#fafafa]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded" style={{ background: `${meta.color}18` }}>
                            <Sparkles size={15} style={{ color: meta.color }} />
                        </div>
                        <div>
                            <h3 className="text-[#1a1a1a] font-semibold ">{meta.label}</h3>
                            <p className="text-[11px] text-[#9b9b9b]">
                                Step {activeIdx + 1} of {queueLength}
                                {queueLength > 1 && activeIdx < queueLength - 1 && ` · ${queueLength - activeIdx - 1} more after this`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {traces.length > 0 && (
                            <button
                                onClick={() => setShowResolution(v => !v)}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${showResolution ? 'bg-blue-500/10 border-blue-300 text-blue-600' : 'border-[#ededed] text-[#9b9b9b] hover:border-blue-200 hover:text-blue-500'}`}
                            >
                                <Zap size={10} />
                                {traces.length} resolved
                            </button>
                        )}
                        <button onClick={onClose} className="p-1.5 rounded hover:bg-[#f0f0f0] text-[#9b9b9b] transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Resolution trace panel */}
                {showResolution && traces.length > 0 && (
                    <div className="px-5 py-3 bg-blue-500/5 border-b border-blue-100">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Zap size={10} /> AI Resolution Trace
                        </p>
                        <div className="space-y-1.5">
                            {traces.map((t, i) => (
                                <div key={i} className="flex items-center gap-2 text-[11px]">
                                    <span className="text-[#9b9b9b] w-16 shrink-0 font-mono">{t.field}</span>
                                    <span className="text-[#6b6b6b] italic truncate max-w-[120px]">"{t.input}"</span>
                                    <span className="text-[#c0c0c0]">→</span>
                                    <span className="text-[#1a1a1a] font-medium truncate max-w-[130px]">"{t.resolved}"</span>
                                    <ResolutionBadge trace={t} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Warnings */}
                {warnings.length > 0 && (
                    <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
                        <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                            {warnings.map((w, i) => (
                                <p key={i} className="text-[11px] text-amber-700">{w}</p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="px-5 py-4 max-h-80 overflow-y-auto scrollbar-hide">

                    {/* CREATE_EXAM */}
                    {action.type === 'CREATE_EXAM' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className={labelClass}>Exam Name</label>
                                <input
                                    type="text"
                                    value={d.exam_name || d.name || ''}
                                    onChange={e => onDataChange({ exam_name: e.target.value, name: e.target.value })}
                                    className={fieldClass}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className={labelClass}>Duration (mins)</label>
                                <input
                                    type="number"
                                    value={d.minutes || 60}
                                    onChange={e => onDataChange({ minutes: e.target.value })}
                                    className={fieldClass}
                                />
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className={labelClass}>Class <span className="text-red-400">*</span></label>
                                <select
                                    value={d.classId || ''}
                                    onChange={e => onDataChange({ classId: e.target.value })}
                                    className={`${fieldClass} bg-white cursor-pointer`}
                                    required
                                >
                                    <option value="" disabled>Select a class…</option>
                                    {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* ADD_QUESTIONS */}
                    {action.type === 'ADD_QUESTIONS' && (
                        <div className="space-y-4">

                            {/* Resolved entity pills */}
                            {(resolvedExam || resolvedSubject || resolvedClass) && (
                                <div className="flex flex-wrap gap-1.5">
                                    {resolvedExam && (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-[11px] text-blue-700 font-medium">
                                            <BookOpen size={10} />
                                            {resolvedExam.exam_name || resolvedExam.name}
                                        </div>
                                    )}
                                    {resolvedSubject && (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-full text-[11px] text-purple-700 font-medium">
                                            <BiSolidShapes size={10} />
                                            {resolvedSubject.name}
                                        </div>
                                    )}
                                    {resolvedClass && (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] text-amber-700 font-medium">
                                            <SiGoogleclassroom size={10} />
                                            {resolvedClass.name}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Selectors */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className={labelClass}>
                                        Target Exam <span className="text-red-400">*</span>
                                        {resolvedExam && <span className="ml-1 text-green-500 normal-case font-normal">✓ auto-resolved</span>}
                                    </label>
                                    <select
                                        value={d.examId || ''}
                                        onChange={e => {
                                            const exam = availableExams.find((ex: any) => ex.id === e.target.value);
                                            onDataChange({
                                                examId: e.target.value,
                                                examName: exam?.exam_name || exam?.name || d.examName,
                                                classId: exam?.classId || d.classId,
                                            });
                                        }}
                                        className={`${fieldClass} bg-white cursor-pointer ${resolvedExam ? 'border-green-300 bg-green-50/40' : 'border-amber-300'}`}
                                    >
                                        <option value="" disabled>Select exam…</option>
                                        {availableExams.map((ex: any) => (
                                            <option key={ex.id} value={ex.id}>{ex.exam_name || ex.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className={labelClass}>
                                        Subject <span className="text-red-400">*</span>
                                        {resolvedSubject && <span className="ml-1 text-green-500 normal-case font-normal">✓ auto-resolved</span>}
                                    </label>
                                    <select
                                        value={d.subjectId || ''}
                                        onChange={e => onDataChange({ subjectId: e.target.value })}
                                        className={`${fieldClass} bg-white cursor-pointer ${resolvedSubject ? 'border-green-300 bg-green-50/40' : 'border-amber-300'}`}
                                    >
                                        <option value="" disabled>Select subject…</option>
                                        {availableSubjects.map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Question list */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className={labelClass}>{(d.questions || []).length} questions ready</label>
                                    <button
                                        onClick={() => setQuestionPreviewIdx(questionPreviewIdx !== null ? null : 0)}
                                        className="text-[10px] text-blue-500 flex items-center gap-1 hover:underline"
                                    >
                                        <Eye size={10} />
                                        {questionPreviewIdx !== null ? 'Hide preview' : 'Preview all'}
                                    </button>
                                </div>

                                {questionPreviewIdx !== null ? (
                                    // Full question browser
                                    <div className="border border-[#ededed] rounded overflow-hidden">
                                        {/* Question navigator */}
                                        <div className="flex items-center justify-between px-3 py-2 bg-[#f9f9f9] border-b border-[#ededed]">
                                            <button
                                                onClick={() => setQuestionPreviewIdx(Math.max(0, questionPreviewIdx - 1))}
                                                disabled={questionPreviewIdx === 0}
                                                className="text-xs px-2 py-0.5 rounded border border-[#ededed] disabled:opacity-30 hover:border-blue-300 transition-colors"
                                            >←</button>
                                            <span className="text-[11px] text-[#6b6b6b]">
                                                Q{questionPreviewIdx + 1} / {(d.questions || []).length}
                                            </span>
                                            <button
                                                onClick={() => setQuestionPreviewIdx(Math.min((d.questions || []).length - 1, questionPreviewIdx + 1))}
                                                disabled={questionPreviewIdx >= (d.questions || []).length - 1}
                                                className="text-xs px-2 py-0.5 rounded border border-[#ededed] disabled:opacity-30 hover:border-blue-300 transition-colors"
                                            >→</button>
                                        </div>
                                        {/* Single question display */}
                                        {(() => {
                                            const q = (d.questions || [])[questionPreviewIdx];
                                            if (!q) return null;
                                            const correct = q.correct_answer || q.answer || q.correctAnswer;
                                            const incorrect = q.incorrect_answers || q.incorrectAnswers || [];
                                            const allOptions = [correct, ...incorrect].filter(Boolean);
                                            return (
                                                <div className="p-4 space-y-3">
                                                    <p className=" text-[#1a1a1a] leading-relaxed font-medium">{q.question || q.text}</p>
                                                    <div className="grid grid-cols-1 gap-1.5">
                                                        {allOptions.map((opt: string, j: number) => (
                                                            <div key={j} className={`flex items-center gap-2 text-xs px-3 py-2 rounded border ${opt === correct ? 'border-green-300 bg-green-50 text-green-700 font-semibold' : 'border-[#ededed] text-[#6b6b6b]'}`}>
                                                                <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold shrink-0 ${opt === correct ? 'bg-green-500 border-green-500 text-white' : 'border-[#d0d0d0] text-[#b0b0b0]'}`}>
                                                                    {String.fromCharCode(65 + j)}
                                                                </span>
                                                                {opt}
                                                                {opt === correct && <CheckCircle2 size={11} className="ml-auto text-green-500" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {q.explanation && (
                                                        <div className="flex gap-2 p-2.5 bg-blue-50 border border-blue-100 rounded">
                                                            <Info size={12} className="text-blue-400 shrink-0 mt-0.5" />
                                                            <p className="text-[11px] text-blue-700 leading-relaxed">{q.explanation}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    // Compact list
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-hide pr-0.5">
                                        {(d.questions || []).map((q: any, i: number) => {
                                            const correct = q.correct_answer || q.answer || q.correctAnswer;
                                            const hasCorrect = !!correct;
                                            return (
                                                <div
                                                    key={i}
                                                    onClick={() => setQuestionPreviewIdx(i)}
                                                    className="flex items-start gap-2.5 bg-[#f9f9f9] border border-[#ededed] rounded p-2.5 cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-colors group"
                                                >
                                                    <span className="text-[10px] font-bold text-white bg-blue-500 rounded px-1.5 py-0.5 shrink-0">Q{i + 1}</span>
                                                    <p className="text-xs text-[#3a3a3a] leading-snug flex-1 line-clamp-2">{q.question || q.text}</p>
                                                    {!hasCorrect && <AlertTriangle size={12} className="text-amber-400 shrink-0" />}
                                                    {hasCorrect && <CheckCircle2 size={12} className="text-green-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CREATE_SUBJECT / CREATE_CLASS */}
                    {(action.type === 'CREATE_SUBJECT' || action.type === 'CREATE_CLASS') && (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className={labelClass}>Name</label>
                                <input
                                    type="text"
                                    value={d.name || ''}
                                    onChange={e => onDataChange({ name: e.target.value })}
                                    className={fieldClass}
                                />
                            </div>
                            {d.description !== undefined && (
                                <div className="space-y-1">
                                    <label className={labelClass}>Description</label>
                                    <textarea
                                        value={d.description || ''}
                                        onChange={e => onDataChange({ description: e.target.value })}
                                        rows={2}
                                        className={`${fieldClass} resize-none`}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#ededed] bg-[#fafafa]">
                    <button onClick={onSkip} className="text-xs text-[#9b9b9b] hover:text-[#6b6b6b] transition-colors flex items-center gap-1">
                        <SkipForward size={12} /> Skip this step
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2  text-[#6b6b6b] hover:text-[#1a1a1a] border border-[#ededed] rounded transition-colors">
                            Cancel all
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isExecuting || (action.type === 'ADD_QUESTIONS' && (!d.examId || !d.subjectId))}
                            className="flex items-center gap-2 px-5 py-2 rounded  font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
                            style={{ background: meta.color }}
                        >
                            {isExecuting
                                ? <><Loader2 size={13} className="animate-spin" /> Working…</>
                                : <><Play size={13} /> {meta.confirmLabel}</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;