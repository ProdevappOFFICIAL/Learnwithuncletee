# AI School Agent — Implementation Plan

## Goal

Add a production-grade AI assistant to the school portal that can orchestrate school
operations end to end: classes, subjects, exams, questions, pupils, staff, results,
report cards, attendance, deployments, exam databases, settings and day-to-day
content. The assistant lives in a collapsible left drawer that can minimize, dock
and expand to full screen, with a mini chat-session sidebar and a live agent step
timeline.

The model is OpenRouter `deepseek/deepseek-v4.1-flash-1017` through Mastra.

---

## Non-negotiables

- All data access stays inside the signed-in user's workspace and permissions.
- The agent can never exceed the caller's RBAC permissions.
- Destructive tools require an explicit `confirm: true` argument; instructions
  force the model to ask the user first.
- Passwords, password hashes and the `studentCode` / `staffCode` credential
  strings never appear in list/detail tool output. Generated login passwords are
  returned only once, from explicit create-account tools.
- The existing dashboard, tables, report-card design and routes are not changed.
- Existing Mastra weather agent/workflow stay registered.

---

## Architecture

### Backend

```
api/src/modules/ai/
  ai.routes.ts         mounted at /api/ai/agent
  ai.controller.ts     HTTP + SSE lifecycle
  ai.service.ts        session/message persistence, history building
  ai.types.ts          shared server types
  ai.stream.ts         Mastra fullStream -> SSE adapter

api/src/mastra/
  index.ts             registers schoolAgent + schoolTools
  agents/school-agent.ts
  tools/school/
    index.ts           SCHOOL_TOOLS record + permission metadata
    context.ts         request-context helpers, permission checks, audit
    resolve.ts         ID-or-name resolvers scoped to the workspace
    shape.ts           safe, compact output shapers
    workspace.tools.ts
    class.tools.ts
    subject.tools.ts
    exam.tools.ts
    question.tools.ts
    people.tools.ts
    results.tools.ts
    attendance.tools.ts
    deployment.tools.ts
    database.tools.ts
    ops.tools.ts
```

### Database (Prisma)

```prisma
model AiChatSession {
  id            String   @id @default(uuid())
  workspaceId   String
  userId        String
  title         String   @default("New chat")
  archived      Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastMessageAt DateTime @default(now())
  messages      AiChatMessage[]

  @@index([workspaceId, userId, lastMessageAt])
}

model AiChatMessage {
  id        String   @id @default(uuid())
  sessionId String
  session   AiChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  role      String   // user | assistant
  content   String   @db.Text
  parts     Json?    // { version, steps: [{ index, status, toolCalls: [...] }] }
  status    String   @default("complete") // streaming | complete | error | aborted
  model     String?
  usage     Json?
  error     String?
  createdAt DateTime @default(now())

  @@index([sessionId, createdAt])
}
```

Migration: `20261119160000_add_ai_chat`.

### Permission

Add `ai.use` to the canonical catalog and grant it by default to OWNER, ADMIN,
MEMBER and TEACHER. The route and every tool check it; tool-level checks still
use the existing per-module permission keys.

---

## API contract

Base: `POST/GET /api/ai/agent` (authenticated, `ai.use`).

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/ai/agent` | Send a message and stream the agent run (SSE) |
| GET | `/api/ai/agent/sessions` | List the caller's chat sessions |
| POST | `/api/ai/agent/sessions` | Create an empty session |
| GET | `/api/ai/agent/sessions/:id` | Session + messages |
| PATCH | `/api/ai/agent/sessions/:id` | Rename |
| DELETE | `/api/ai/agent/sessions/:id` | Delete |
| GET | `/api/ai/agent/tools` | Tool catalog for the UI (names, groups, descriptions) |

### Chat request

```json
{ "sessionId": "optional", "message": "Create a JSS2 exam...", "regenerate": false }
```

### SSE events

```
event: session      { id, title }
event: step-start   { index, at }
event: tool-call    { toolCallId, toolName, input }
event: tool-result  { toolCallId, toolName, output, isError, durationMs }
event: text-delta   { text }
event: reasoning    { text }          // optional, collapsible
event: step-finish  { index, status }
event: done         { messageId, finishReason, usage, elapsedMs }
event: error        { message }
```

Heartbeat comment every 15s. Client abort aborts the Mastra run and persists the
partial assistant message as `aborted`.

---

## Agent design

- One supervisor-level agent (`school-agent`) with a focused toolset per domain.
- Dynamic tool exposure: only tools allowed by the caller's permissions are sent
  to the model. Admin/Owner get the full catalog.
- Instructions include:
  - current user, workspace, role, current session/term, grading bands;
  - "resolve names to IDs with list tools before mutating";
  - "never invent IDs or results";
  - "ask before destructive actions and pass confirm: true only after consent";
  - "summarize tool outcomes, report created IDs and next steps";
  - "use the current academic period unless the user names another".
- Conversation continuity is stored in Postgres; the last ~40 messages are sent
  to the model, with compact tool-action digests so IDs survive across turns.
- `maxSteps` 16, temperature 0.2, abort signal wired to the HTTP request.

## Tool catalog (61 tools)

### Workspace & settings (4)
`get_school_overview`, `get_academic_settings`, `update_academic_settings`,
`get_my_statuses`

### Classes (5)
`list_classes`, `get_class`, `create_class`, `update_class`, `delete_class`

### Subjects (5)
`list_subjects`, `get_subject`, `create_subject`, `update_subject`,
`delete_subject`

### Exams (6)
`list_exams`, `get_exam`, `create_exam`, `create_exam_with_questions`,
`update_exam`, `delete_exam`

### Questions (7)
`list_questions`, `get_question`, `create_question`, `bulk_create_questions`,
`update_question`, `delete_question`, `get_question_bank`

### People (10)
`list_pupils`, `get_pupil`, `create_pupil`, `update_pupil`,
`list_staff`, `create_teacher`, `update_teacher`,
`list_combinations`, `create_combination`, `update_combination`

### Results & report cards (10)
`list_online_results`, `list_offline_results`, `get_result_summary`,
`list_grade_entries`, `enter_grade_entries`, `publish_results`,
`get_pupil_report_card`, `save_report_card`, `get_attendance_summary`,
`list_report_cards`

### Attendance (2)
`get_attendance_register`, `mark_attendance`

### Deployments (8)
`list_deployments`, `create_deployment`, `start_deployment`, `end_deployment`,
`update_deployment_scope`, `delete_deployment`, `list_security_profiles`,
`create_security_profile`

### Exam databases (6)
`list_exam_databases`, `get_exam_database`, `create_exam_database`,
`export_class_to_database`, `import_exam_database`, `delete_exam_database`

### Day-to-day operations (8)
`list_notices`, `create_notice`, `list_materials`, `create_material`,
`list_assignments`, `create_assignment`, `list_fee_invoices`, `create_fee_invoice`,
`record_fee_payment`

Every tool:
- validates permission with `roleHasPermission`;
- resolves/verifies workspace ownership before touching an ID;
- returns compact `{ ok, data, meta?, message }` output;
- writes an `AI_TOOL` audit log for mutations.

---

## Frontend

### Files

```
src/lib/aiChat.ts                    API client + SSE parser + types
src/lib/api.ts                       add reusable authenticated fetch
src/components/dashboard/ai/
  AiChatDrawer.tsx                   shell, modes, keyboard, focus
  ChatSessionRail.tsx                mini session sidebar
  ChatThread.tsx                     messages + streaming
  ChatMessage.tsx                    markdown, actions, artifacts
  AgentSteps.tsx                     live step timeline / tool cards
  ChatComposer.tsx                   textarea, send/stop, shortcuts
  useAiChat.ts                       state machine, session CRUD, streaming
src/components/dashboard/DashboardLayout.tsx  launcher + layout-root drawer
```

### Modes

- `closed` — floating `Sparkles` launcher + topbar button.
- `minimized` — compact bottom-right card with last activity, restore/close.
- `drawer` — left dock, ~620px, session rail + thread. Desktop does not block the
  whole dashboard; mobile uses a full-width overlay.
- `full` — `fixed inset-0` full-screen workspace.

The mode is persisted per user in `localStorage` (`lwu_ai_mode`), along with the
last open session id. Opening chat closes notifications/account overlays.

### Session rail

- New chat, search, grouped by Today / Yesterday / Previous 7 days / Older.
- Inline rename and delete (with confirm).
- Current session highlighted with the lime accent used in AccountDialog.
- Mobile: horizontal session chips above the thread.

### Thread

- Welcome state with role-aware suggested prompts.
- User bubbles and assistant messages in the existing brand palette.
- Streaming plain-text while tokens arrive; completed messages render sanitized
  markdown (`react-markdown` + `remark-gfm` + `rehype-sanitize`).
- Copy, regenerate (last turn) and retry-on-error actions.
- Auto-scroll only when the user is near the bottom.
- Token/elapsed footer per assistant turn.

### Agent steps

- A collapsible "Run steps" card above/inside each assistant turn.
- Per step: spinner → check/x, human tool label, short input summary, duration.
- Expand a step to see pretty-printed input/output, with secrets already redacted
  server-side.
- Artifacts: when a tool returns `{ entity: { type, id, label } }`, render an
  "Open" link to the matching dashboard route (exam, class, pupil, report card,
  deployment).

### Composer

- Auto-growing textarea, Enter sends, Shift+Enter newline.
- Stop button while streaming (AbortController).
- Char counter + 8,000-char limit, disabled state when no permission.
- Error banner with retry; offline detection.

### A11y / UX

- `role="dialog"`, `aria-modal` in drawer/full, `inert` when closed.
- Focus composer on open; Escape minimizes; `Ctrl/Cmd+Shift+A` toggles.
- `aria-live="polite"` for streamed text and step statuses.
- Respects `prefers-reduced-motion` (global CSS already handles this).
- Scroll positions preserved per session; draft text preserved per session.

---

## Security & reliability

- Session ownership enforced on every query by `userId` + `workspaceId`.
- One active run per user/session; a new send aborts the previous run.
- In-memory rate limit: 20 sends/minute/user.
- Message length cap 8,000 characters; history window 40 messages.
- Stream disconnect saves partial output; failed runs save an `error` message so
  the UI can retry.
- Mastra errors are mapped to friendly messages; no stack traces reach the client.
- `mastra/index.ts` is refactored to avoid top-level await (CommonJS runtime) and
  uses LibSQL storage only. DuckDB observability domain is optional and removed
  from the boot path.

---

## Verification

1. `npx prisma generate` + `npx prisma migrate deploy`.
2. API `npx tsc -p . --noEmit` and `npm run build`.
3. Frontend `npx tsc -p tsconfig.app.json --noEmit` and `npm run build`.
4. API smoke:
   - `GET /api/ai/agent/tools` returns the catalog.
   - `POST /api/ai/agent` streams `session`, `step-*`, `text-delta`, `done`.
   - "list classes" returns real classes.
   - "create a class named AI Test" creates it, appears in `GET /classes`, then
     delete it through the agent (confirm flow).
   - "create an exam under JS2 with 5 questions" exercises multi-step tools.
5. Browser:
   - Open drawer from topbar and floating launcher.
   - Send a prompt; watch steps and streamed answer.
   - Minimize, restore, full-screen, close.
   - Create/rename/delete a chat in the rail.
   - Reload and confirm history persists.
   - Verify teacher/member permissions filter tools; student cannot open the AI.
