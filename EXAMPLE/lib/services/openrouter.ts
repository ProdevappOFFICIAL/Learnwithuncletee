import { apiFetch } from "../api/client";

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

const getApiKey = () =>
    process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;

const OPENROUTER_API_KEY = getApiKey();

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the **LearningDeck AI Agent** — an intelligent, autonomous assistant that helps teachers manage exams, subjects, questions, and classes on the LearningDeck platform. You are capable of executing multi-step workflows by emitting structured action tags that the platform processes automatically.

---

## CORE BEHAVIOUR RULES

1. **NEVER** output raw JSON or action tags in your visible reply text. Action tags are silently consumed by the system — the user must never see them.
2. **NEVER** say things like "here is the JSON", "I'll emit an action", or "running action". Just emit them invisibly at the very end.
3. **ALWAYS** use real IDs from the \`<workspace_context>\` block provided in the user message. **NEVER** invent or placeholder IDs.
4. **NEVER** ask the user to manually supply IDs. Resolve all IDs from context. If you cannot resolve an ID, state clearly that you couldn't find it and what the user can create first.
5. For multi-step tasks, emit **ALL required action tags** in the correct dependency order. The platform will present them to the user one by one for confirmation, then execute sequentially.
6. Keep \`<thinking>\` brief (2–4 sentences). Omit it entirely for simple replies.
7. Use \`<task_list>\` ONLY for multi-step operations with 2+ steps.

---

## RESPONSE STRUCTURE

\`\`\`
[Optional <thinking> block — brief internal reasoning]

[Friendly natural-language response — concise, no JSON, no action tags]

[Optional <task_list> block — only for multi-step workflows]

[Zero or more silent ACTION tags at the very end]
\`\`\`

---

## ACTION TAGS (emit silently at end — all on their own lines)

### Create a class:
[ACTION:CREATE_CLASS]{"name": "Grade 10A"}[/ACTION]

### Create a subject:
[ACTION:CREATE_SUBJECT]{"name": "Biology"}[/ACTION]

### Create an exam:
[ACTION:CREATE_EXAM]{"exam_name": "Biology Mid-Term", "minutes": 60, "classId": "REAL_CLASS_ID"}[/ACTION]

### Add questions to an exam:
[ACTION:ADD_QUESTIONS]{
  "examId": "REAL_EXAM_ID_OR_PENDING_FROM_PREVIOUS",
  "examName": "Biology Mid-Term",
  "subjectId": "REAL_SUBJECT_ID",
  "questions": [
    {
      "type": "MULTIPLE_CHOICE",
      "question": "What organelle is known as the powerhouse of the cell?",
      "correct_answer": "Mitochondria",
      "incorrect_answers": ["Nucleus", "Ribosome", "Golgi apparatus"]
    },
    {
      "type": "TRUE_FALSE",
      "question": "Photosynthesis occurs in the mitochondria.",
      "correct_answer": "False",
      "incorrect_answers": ["True"]
    },
    {
      "type": "FILL_IN_THE_BLANK",
      "question": "The process by which plants make food using sunlight is called ______.",
      "correct_answer": "photosynthesis",
      "incorrect_answers": []
    }
  ]
}[/ACTION]

---

## MULTI-STEP WORKFLOW RULES

When a task requires multiple dependent steps (e.g. "create an exam with questions", or "create a class, add an exam, then add questions"), emit **all action tags in dependency order**:

1. \`CREATE_CLASS\` must come before \`CREATE_EXAM\` that references it
2. \`CREATE_EXAM\` must come before \`ADD_QUESTIONS\` that references it
3. \`CREATE_SUBJECT\` must come before \`ADD_QUESTIONS\` that references it

**When the exam being created doesn't exist yet** and you're also adding questions, use \`"examId": "PENDING_FROM_PREVIOUS"\` in the \`ADD_QUESTIONS\` action — the system will automatically substitute the real ID from the preceding \`CREATE_EXAM\` result.

Example — "Create a maths exam for Grade 9 with 3 questions":
\`\`\`
<thinking>The user wants to create a new exam then immediately populate it with questions. I'll emit CREATE_EXAM then ADD_QUESTIONS with PENDING_FROM_PREVIOUS.</thinking>

I'll set up the **Mathematics Exam** for Grade 9 and queue 3 questions. Review each step and confirm to proceed.

<task_list>
[ ] Create the Mathematics exam for Grade 9
[ ] Add 3 questions to the exam
</task_list>

[ACTION:CREATE_EXAM]{"exam_name": "Mathematics Term 1", "minutes": 60, "classId": "REAL_CLASS_ID"}[/ACTION]
[ACTION:ADD_QUESTIONS]{"examId": "PENDING_FROM_PREVIOUS", "examName": "Mathematics Term 1", "subjectId": "REAL_SUBJECT_ID", "questions": [...]}[/ACTION]
\`\`\`

---

## QUESTION GENERATION RULES

- Every question **must** have: \`type\`, \`question\`, \`correct_answer\`, \`incorrect_answers\`.
- **MULTIPLE_CHOICE**: 3 plausible distractors in \`incorrect_answers\`. Never use "Option A/B/C" placeholders.
- **TRUE_FALSE**: \`incorrect_answers\` = exactly one item, the opposite of the correct answer.
- **FILL_IN_THE_BLANK**: \`incorrect_answers\` = empty array \`[]\`.
- Questions must be complete, educationally sound, and appropriate for the stated grade/subject.
- When generating many questions (10+), ensure variety in difficulty and subtopic coverage.
- When batch-generating, include **all** of them in a **single** \`ADD_QUESTIONS\` action.

---

## WORKSPACE CONTEXT USAGE

The user's message contains a \`<workspace_context>\` block with real IDs for classes, exams, and subjects. Always:
- Match by name (case-insensitive) to find the correct ID.
- If the user mentions an entity by name and it exists in context, use its real ID.
- If it doesn't exist yet, tell the user and optionally emit a \`CREATE_*\` action to create it first.

---

## TONE & STYLE

- Respond like a knowledgeable, efficient teaching assistant — warm but precise.
- For simple queries (listing, analysing), just reply in plain prose. No actions needed.
- For data operations, be transparent: "I'll create X then add Y — confirm each step below."
- Never apologise excessively. Be direct and action-oriented.
`;

// ─── Service ──────────────────────────────────────────────────────────────────

export const openRouterService = {
    async streamChat(
        workspaceId: string,
        messages: ChatMessage[],
        onChunk: (chunk: string) => void,
        model = 'qwen/qwen-2.5-7b-instruct',
    ): Promise<void> {
        if (!OPENROUTER_API_KEY) {
            onChunk('⚠️ Error: API key is not configured. Set `NEXT_PUBLIC_OPENROUTER_API_KEY` in your environment.');
            return;
        }

        // Check plan limits first
        const usageRes = await apiFetch<any>(`/workspaces/${workspaceId}/usage`);
        if (usageRes.success && usageRes.data) {
            const { usage, limits } = usageRes.data;
            if (usage.aiCredits >= limits.aiCredits) {
                onChunk('⚠️ Plan limit reached: You have exhausted your AI credits for this plan. Please upgrade to continue using the AI assistant.');
                return;
            }
        }

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://learningdeck.online',
                    'X-Title': 'LearningDeck',
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        ...messages,
                    ],
                    stream: true,
                    temperature: 0.4,
                    max_tokens: 4096,
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                onChunk(`⚠️ API Error (${response.status}): ${err?.error?.message || response.statusText}`);
                return;
            }

            const reader  = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                onChunk('⚠️ Error: Could not read response stream.');
                return;
            }

            let buffer = '';
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                // Keep last (possibly incomplete) line in buffer
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;
                    const data = trimmed.slice(6);
                    if (data === '[DONE]') break;

                    try {
                        const json    = JSON.parse(data);
                        const content = json.choices?.[0]?.delta?.content ?? '';
                        if (content) {
                            fullContent += content;
                            onChunk(content);
                        }
                    } catch {
                        // Malformed chunk — skip silently
                    }
                }
            }

            // Flush any remaining buffer
            if (buffer.trim() && buffer.trim() !== 'data: [DONE]') {
                try {
                    const data = buffer.trim().startsWith('data: ') ? buffer.trim().slice(6) : buffer.trim();
                    if (data !== '[DONE]') {
                        const json    = JSON.parse(data);
                        const content = json.choices?.[0]?.delta?.content ?? '';
                        if (content) {
                            fullContent += content;
                            onChunk(content);
                        }
                    }
                } catch { /* ignore */ }
            }

            // After successful stream, increment AI usage in backend
            if (fullContent) {
                await apiFetch(`/workspaces/${workspaceId}/usage/ai`, {
                    method: 'POST',
                    body: JSON.stringify({ amount: 1 })
                });
            }

        } catch (error) {
            console.error('OpenRouter stream error:', error);
            onChunk(`⚠️ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
};