# Learnwithuncletee — API Backend Plan

**Version:** 1.0
**Prepared:** 03 October 2026
**Scope:** Backend API needed to power 100% of the current frontend — public website (11 pages) + 3 role portals (Student × 5 pages, Teacher × 4 pages, Admin × 10 pages) + Login.
**Frontend source of truth:** `src/routes/paths.ts`, `src/routes/index.tsx`, `src/data/*`, `src/pages/**`.

> This is a build-ready plan. Every endpoint below maps to a real screen in the repo. Mock data currently in `src/data/dashboard.ts` is marked for replacement per-portal in §10.

---

## 1. Frontend inventory (what the API must serve)

### 1.1 Public website — read-mostly CMS content

| Frontend route | File | Data it needs from API (currently hardcoded) |
|---|---|---|
| `/` | `src/pages/HomePage.tsx` + `src/components/home/*` | hero slides, key stats, programmes, why-choose-us, services, facilities, student-life highlights, news (latest 3–6), gallery preview, testimonials |
| `/about` | `src/pages/AboutPage.tsx` | story, mission/vision, core values, leadership (`src/data/staff.ts`), stats |
| `/academics` | `src/pages/AcademicsPage.tsx` | programmes (`src/data/programmes.ts`), subjects, learning approaches, FAQs (`src/data/faqs.ts`) |
| `/admissions` | `src/pages/AdmissionsPage.tsx` | entry requirements, process steps, fee table, downloadable forms, important dates, FAQs |
| `/student-life` | `src/pages/StudentLifePage.tsx` | clubs, sports, cultural activities, boarding info |
| `/services` | `src/pages/ServicesPage.tsx` | services (`src/data/services.ts`) + detail template |
| `/news` | `src/pages/NewsPage.tsx` | articles (`src/data/news.ts`), categories, featured story, events list |
| `/gallery` | `src/pages/GalleryPage.tsx` | images (`src/data/gallery.ts`) by category |
| `/contact` | `src/pages/ContactPage.tsx` | address/phones/email/hours, department contacts, contact-form submit |
| `/login` | `src/pages/LoginPage.tsx` | auth (see §4); role picker: student · parent · teacher · admin |

### 1.2 Portals — transactional CRUD

| Portal | Frontend routes | Files |
|---|---|---|
| Chooser | `/dashboard` | `src/pages/dashboard/DashboardIndexPage.tsx` |
| Student (5) | `/dashboard/student`, `…/fees`, `…/results`, `…/assignments`, `…/virtual-class` | `src/pages/dashboard/student/*.tsx` |
| Teacher (4) | `/dashboard/teacher`, `…/assignments`, `…/results`, `…/classes` | `src/pages/dashboard/teacher/*.tsx` |
| Admin (10) | `/dashboard/admin`, `…/students`, `…/teachers`, `…/admissions`, `…/fees`, `…/results`, `…/assignments`, `…/virtual-class`, `…/news`, `…/settings` | `src/pages/dashboard/admin/*.tsx` |
| Alias | `/admin/student/*` → 302 to `/dashboard/student` | `src/routes/index.tsx` |

Mock screens and the exact widgets they render (each becomes an endpoint in §7):

- **StudentDashboardPage** — 4 stat tiles (term average, attendance %, pending assignments, fee balance), today's timetable (time/subject/teacher/room), "up next" assignments, upcoming live classes.
- **StudentFeesPage** — 3 summary tiles, invoice table (invoice id, term, amount, paid, balance, status, due), Pay button, invoice download.
- **StudentResultsPage** — 4 tiles (average, position, subjects, attendance), subject rows (CA/30, Exam/70, Total/100, grade, remark), class-teacher + principal remarks, report-card download.
- **StudentAssignmentsPage** — submit form (assignment select, file upload ≤10 MB, note), list with statuses Pending / Submitted / Graded + score.
- **StudentVirtualClassPage** — live-now banner (join link), scheduled cards (topic/teacher/time/duration/status), notes download, recordings.
- **TeacherDashboardPage** — 4 tiles (my classes, to-grade count, class average, next live class), recent submissions table, week timetable.
- **TeacherAssignmentsPage** — create form (title, class, due date, instructions, attachment), assignment table (submitted x/y, status Collecting/Grading/Graded), grade-pending queue, export marks.
- **TeacherResultsPage** — 4 tiles, score-entry table (CA/exam/total/grade per pupil), edit, publish (draft → published).
- **TeacherClassesPage** — assigned-classes table (pupils, subject, room, schedule, next lesson), start-live, pupil list.
- **AdminDashboardPage** — 4 tiles (students, staff, fees collected, pending admissions), fee-collection bars, today's agenda, latest applications.
- **AdminStudentsPage** — 4 tiles, searchable/filterable directory (name, ID `LWU/YYYY/NNNN`, class, guardian phone, fee state, average).
- **AdminTeachersPage** — 4 tiles, staff directory (role, classes, periods/week, status Active/On leave).
- **AdminAdmissionsPage** — 4 tiles, application queue (applicant, class sought, stage, status).
- **AdminFeesPage** — 4 tiles (expected/collected/outstanding/overdue>30d), transactions table (ref, pupil, amount ₦, method, date, status), bulk reminders, ledger export.
- **AdminResultsPage** — 4 tiles, broadsheet approval table (class, submitted-by, average, status).
- **AdminAssignmentsPage** — monitor table (title, teacher·class, completion %, status), workload view.
- **AdminVirtualClassPage** — schedule table (topic, teacher, time Africa/Lagos, status), schedule-new.
- **AdminNewsPage** — compose form (title, category, message, image), published list with edit/unpublish.
- **AdminSettingsPage** — school profile form, session/term dates, roles & access matrix.

---

## 2. Recommended stack

| Concern | Recommendation | Why |
|---|---|---|
| Runtime | **Node.js 20 LTS + TypeScript** | Matches frontend toolchain (`tsc -b`, Node ≥ 20.19 in `package.json`) |
| Framework | **NestJS** (preferred) or Express + Zod | Nest gives modules/guards/validation per domain below; Express is fine for MVP |
| DB (system of record) | **PostgreSQL 15+** + Prisma ORM | Relational data (results, fees, attendance) needs joins + transactions |
| File storage | **S3-compatible** (AWS S3 / Cloudflare R2) + CDN | Assignment PDFs, report cards, gallery, service images |
| Auth | Access JWT (15 min) + rotating refresh JWT (httpOnly cookie) + Argon2id password hashing | Matches split-screen login + role picker; server enforces roles |
| Realtime (optional P2) | Socket.io or SSE for announcements/live-class status | Topbar bell + "Join now" state |
| Payments (Nigeria) | **Paystack** (primary) + Flutterwave fallback | Verifiable webhooks, bank/card/transfer, receipts |
| Virtual class | **Zoom Meeting SDK / Google Meet links** stored per lesson + recordings URLs | No need to build video infra in MVP |
| Email/SMS | Termii or Africa's Talking (SMS) + Resend/SES (email) | Fee reminders, admission offers, OTP recovery |
| Docs | OpenAPI 3.1 via `@nestjs/swagger`, served at `/api/docs` | Frontend team generates types |

---

## 3. Global API conventions

- **Base URL:** `https://api.learnwithuncletee.org/api/v1` · local `http://localhost:4000/api/v1`.
- **Auth header:** `Authorization: Bearer <accessToken>`; refresh via `POST /auth/refresh` (cookie).
- **Roles:** `super_admin | admin | bursar | admissions | teacher | parent | student`. Frontend role picker is UX only — every route enforces server-side (see §6).
- **Pagination (all lists):** `?page=1&limit=20&search=&sort=&order=` →

```json
{ "data": [ … ], "meta": { "page": 1, "limit": 20, "total": 248, "totalPages": 13 } }
```

- **Success envelope:** `{ "data": <payload>, "message": "ok" }` (lists add `meta`).
- **Error envelope (always):**

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Due date must be in the future", "details": [{ "field": "dueDate", "issue": "must be future date" }] } }
```

- **Status codes:** `200` ok · `201` created · `204` deleted · `400` validation · `401` unauthenticated · `403` forbidden (wrong role/scope) · `404` not found · `409` conflict (duplicate ID/email) · `422` business rule (e.g. publish with missing scores) · `429` rate-limited.
- **IDs:** UUIDv7 primary keys externally; human codes kept as unique business keys (`studentCode: LWU/2024/0312`, `invoiceNo: F-2026-T1`, `txnRef: TXN-90412`).
- **Money:** integer **kobo** in DB (`18500000` = ₦185,000); formatted `₦` strings only in presentation.
- **Dates:** ISO-8601 UTC in API; `Africa/Lagos` rendering in UI.
- **Uploads:** `multipart/form-data`, 10 MB default cap (matches assignment form), allowlist `pdf,doc,docx,jpg,png,webp`; virus-scan hook point.
- **Rate limits:** login `10/min/IP`, contact/admissions-public `30/min/IP`, general `300/min/user`.

---

## 4. Auth module (`/auth`)

Login page fields today: *portal role (UX hint) + ID-or-email + password*, plus *recovery mode*. Backend:

| Method & path | Access | Purpose | Notes |
|---|---|---|---|
| `POST /auth/login` | public | `{ identity, password }` → `{ accessToken, user: { id, role, name, portals[] } }` + refresh cookie | `identity` = email OR staff/student code. Rate-limited. Returns `mustChangePassword` flag for first login |
| `POST /auth/refresh` | cookie | Rotate refresh → new access token | Reuse detection → revoke family |
| `POST /auth/logout` | auth | Revoke refresh family | |
| `POST /auth/recovery/request` | public | `{ identity }` → always `200` (no enumeration) + SMS/email ticket for office | Matches "contact the school office" copy |
| `POST /auth/recovery/confirm` | office/admin | `{ ticket, newPassword }` + audit log | Admin-assisted reset (no self-serve link in MVP) |
| `GET /auth/me` | auth | Current user + role + linked profiles (student↔parent↔staff) + portal permissions | Powers `DashboardLayout` user card + sidebar filtering |
| `PATCH /auth/me/password` | auth | Change password | Argon2id, min 8 chars |

Example — `POST /auth/login`:

```json
// request
{ "identity": "LWU/2024/0312", "password": "••••••••" }
// response 200
{ "data": {
    "accessToken": "eyJ…",
    "user": { "id": "uuid", "role": "student", "name": "Daniel E.",
      "student": { "code": "LWU/2024/0312", "class": "JSS 2 Diamond" } }
}, "message": "Welcome back, Daniel" }
```

---

## 5. Core data models

Prisma-style sketch (Postgres). Only fields the UI actually displays are required in MVP; the rest are marked P2.

```prisma
model User        { id String @id, role Role, name String, email String? @unique,
                   phone String?, passwordHash String, status Active|Suspended,
                   studentProfile Student? , staffProfile Staff?, parentProfile Parent?,
                   createdAt DateTime, updatedAt DateTime }
model Student     { id String @id, code String @unique, // LWU/2024/0312
                   userId String @unique, firstName String, lastName String,
                   gender String?, dob DateTime?, photoUrl String?,
                   classId String, guardians Parent[] , status Enrolled|Graduated|Withdrawn }
model Parent      { id String @id, userId String @unique, occupation String?,
                   children Student[], address String? }
model Staff       { id String @id, staffCode String @unique, userId String @unique,
                   department String?, designation String?, // HOD Sciences…
                   subjects Subject[], classes Class[], periodsPerWeek Int?,
                   employmentStatus Active|OnLeave|Exited }
model AcademicSession { id String @id, name String @unique, // "2026/27"
                   terms Term[] , isCurrent Boolean }
model Term        { id String @id, sessionId String, name String, // First Term
                   startsAt DateTime, endsAt DateTime, isCurrent Boolean }
model Class       { id String @id, name String @unique, // JSS 2 Diamond
                   level String, // JSS 2  programme EarlyYears|Primary|Secondary
                   classTeacherId String?, room String?, capacity Int? }
model Subject     { id String @id, name String @unique, code String @unique, category String? }
model TimetableSlot { id String @id, classId String, subjectId String, staffId String,
                   dayOfWeek Int, startsAt String, endsAt String, room String?, termId String }
model Attendance  { id String @id, studentId String, classId String, date DateTime,
                   status Present|Late|Absent|Excused, markedBy String, @@unique([studentId, date]) }
model Assignment  { id String @id, title String, instructions String?, classId String,
                   subjectId String, teacherId String, dueAt DateTime,
                   attachmentUrl String?, maxScore Int @default(20),
                   status Draft|Published|Closed, termId String }
model Submission  { id String @id, assignmentId String, studentId String,
                   fileUrl String?, note String?, submittedAt DateTime,
                   score Float?, feedback String?, status Submitted|Late|Graded }
model ResultEntry { id String @id, studentId String, subjectId String, classId String,
                   termId String, ca Float, exam Float, total Float, grade String,
                   status Draft|Approved|Published, teacherRemark String?,
                   @@unique([studentId, subjectId, termId]) }
model FeeStructure{ id String @id, programme String, termId String, tuitionKobo Int,
                   registrationKobo Int, boardingKobo Int, otherKobo Int, dueDate DateTime }
model Invoice     { id String @id, invoiceNo String @unique, studentId String, termId String,
                   amountKobo Int, paidKobo Int, balanceKobo Int,
                   status Unpaid|PartPaid|Paid|Overdue, dueDate DateTime }
model Payment     { id String @id, txnRef String @unique, invoiceId String,
                   amountKobo Int, method Card|Transfer|Cash|USSD, provider Paystack|Flutterwave|Offline,
                   providerRef String?, status Pending|Confirmed|Failed, receiptUrl String?,
                   receivedAt DateTime }
model AdmissionApplication { id String @id, applicantName String, dob DateTime?,
                   classSought String, guardianName String, guardianPhone String,
                   guardianEmail String?, documents Json?, // birth cert, report…
                   stage Enquiry|Documents|Interview|Offer|Accepted|Enrolled|Rejected,
                   entranceScore Float?, notes String? }
model VirtualLesson { id String @id, title String, topic String, subjectId String,
                   teacherId String, classId String, startsAt DateTime, durationMins Int,
                   joinUrl String, notesUrl String?, recordingUrl String?,
                   status Scheduled|Live|Ended|Cancelled }
model Announcement{ id String @id, title String, body String, category News|Events|Announcements|Academic|Sports|Cultural,
                   coverUrl String?, audience All|Students|Parents|Staff,
                   publishedAt DateTime?, isPublished Boolean }
model Event       { id String @id, title String, startsAt DateTime, endsAt DateTime?,
                   location String?, description String? }
model MessageThread { id String @id, subject String, participants String[], // P2
                   updatedAt DateTime }
model GalleryImage{ id String @id, url String, category Campus|Academics|Students|Sports|Cultural|Events|Staff,
                   caption String?, takenAt DateTime? }
model ServiceItem { id String @id, slug String @unique, name String, summary String,
                   description String, features Json?, imageUrl String?, ctaLabel String? }
model ContactEnquiry { id String @id, name String, email String, phone String?,
                   department Admissions|Catering|Coaching|General|Portal|Other,
                   subject String?, message String, status New|Replied|Closed }
model AuditLog    { id String @id, actorId String, action String, entity String,
                   entityId String, createdAt DateTime }
```

Computed server-side (never trust client): `Submission.status` (late if `submittedAt > dueAt`), `ResultEntry.total = ca + exam`, `grade` from thresholds (§7.6), `Invoice.balanceKobo`, class positions/averages, attendance %.

Grade thresholds (configurable in `Settings`, defaults):
`A ≥ 75 · B ≥ 65 · C ≥ 55 · D ≥ 45 · E ≥ 40 · F < 40` (tune with academic office).

---

## 6. Authorization matrix (enforced server-side)

| Capability | super_admin | admin | bursar | admissions | teacher | parent | student |
|---|---|---|---|---|---|---|---|
| Manage users/roles | ✅ | ✅ | — | — | — | — | — |
| Students CRUD / class assign | ✅ | ✅ | read | read | read own classes | read own children | read self |
| Staff CRUD | ✅ | ✅ | — | — | read | — | — |
| Sessions/terms/classes/subjects/timetable | ✅ | ✅ | — | — | read own | read own children | read own |
| Mark attendance | ✅ | ✅ | — | — | ✅ own classes | read own children | read self |
| Create assignments | ✅ | ✅ | — | — | ✅ own classes | — | — |
| Submit assignments | — | — | — | — | — | — | ✅ self |
| Grade submissions | ✅ | ✅ | — | — | ✅ own classes | read own children | read self |
| Enter/approve/publish results | ✅ | ✅ approve/publish | — | — | ✅ enter own | read own children (published) | read self (published) |
| Fee structures/invoices/reminders | ✅ | ✅ | ✅ | — | — | ✅ pay own children | ✅ view/pay self |
| Confirm offline payments | ✅ | ✅ | ✅ | — | — | — | — |
| Admissions pipeline | ✅ | ✅ | — | ✅ | — | apply (public) | — |
| Virtual lessons schedule | ✅ | ✅ | — | — | ✅ own | read | read/join own |
| News/events/gallery/services CMS | ✅ | ✅ | — | — | — | read | read |
| Contact enquiries | ✅ | ✅ | — | ✅ admissions queue | — | — | — |
| Reports/exports | ✅ | ✅ | ✅ finance | ✅ admissions | ✅ own classes | — | — |
| Settings | ✅ | ✅ | — | — | — | — | — |

Rules: (a) students see only `studentId = self`; (b) parents only linked `children[]`; (c) teachers only assigned `classes[]/subjects[]`; (d) unpublished results/scores return `403` to parent/student; (e) UI hiding ≠ security.

---

## 7. Endpoint catalog

Prefix: `/api/v1`. `🔒` = auth required. Roles in brackets.

### 7.1 Profile / dashboards (backs every `DashboardLayout` + tile)

| Method & path | Roles | Powers screen |
|---|---|---|
| `GET /me/overview` 🔒 | student | **Student dashboard** tiles: term average, attendance %, pending count, fee balance |
| `GET /me/timetable?day=` 🔒 | student, teacher | Timetable card (`day` default today) |
| `GET /me/upcoming?limit=3` 🔒 | student | "Up next" assignments + live classes |
| `GET /teacher/overview` 🔒 | teacher | **Teacher dashboard** tiles + week highlights |
| `GET /admin/overview` 🔒 | admin, super_admin | **Admin dashboard** tiles, fee bars, agenda, latest applications |
| `GET /notifications` 🔒 | all | Topbar bell: `{ id, title, body, read, createdAt }`; `PATCH /notifications/:id/read` |

### 7.2 Academic core — sessions, classes, subjects, timetable

| Method & path | Roles | Notes |
|---|---|---|
| `GET /sessions` / `POST /sessions` / `PATCH /sessions/:id` | read all auth; write admin | `{ name, terms[], isCurrent }` |
| `GET /terms?sessionId=` etc. | read auth; write admin | `{ name, startsAt, endsAt, isCurrent }` |
| `GET /classes` `POST /classes` `GET /classes/:id` `PATCH /classes/:id` | read auth (scoped); write admin | Pupil count + teacher populated. Filters `?level=&programme=` |
| `GET /classes/:id/pupils` 🔒 | teacher own, admin | **TeacherClassesPage** pupil list |
| `GET /subjects` `POST /subjects` `PATCH /subjects/:id` | read auth; write admin | |
| `GET /timetable?classId=&day=` 🔒 | scoped read | **Student/Teacher dashboards** |
| `POST /timetable` `PATCH /timetable/:id` `DELETE /timetable/:id` | admin | Bulk upsert `POST /timetable/bulk` supported |

### 7.3 Students (`AdminStudentsPage` + student self-service)

| Method & path | Roles | Notes |
|---|---|---|
| `GET /students?search=&classId=&feeStatus=&page=` 🔒 | admin, teacher (own classes), parent (own children) | Directory with `feeStatus, average, guardian` joined. This is the admin table |
| `POST /students` 🔒 | admin | Create + auto-create `User` + link guardians. `201` returns credentials ticket |
| `GET /students/:id` 🔒 | scoped (self/child/own-class/admin) | Full profile: bio, class, guardians, attendance %, average, fee summary |
| `PATCH /students/:id` 🔒 | admin | Edit bio, reassign `classId` (audit-logged) |
| `POST /students/:id/guardians` 🔒 | admin | `{ parentId }` link |
| `PATCH /students/:id/status` 🔒 | admin | Enrolled/Graduated/Withdrawn |
| `GET /students/:id/report-card?termId=` 🔒 | scoped, published only | PDF stream → **Download report card** button |

### 7.4 Staff (`AdminTeachersPage`)

| Method & path | Roles | Notes |
|---|---|---|
| `GET /staff?search=&status=&department=` 🔒 | admin | Directory + `periodsPerWeek, classes[]` |
| `POST /staff` / `GET /staff/:id` / `PATCH /staff/:id` 🔒 | admin | Assign `subjectIds[], classIds[]`, leave status |
| `GET /teacher/classes` 🔒 | teacher | **TeacherClassesPage** table |
| `POST /teacher/classes/:id/live` 🔒 | teacher own | Creates/returns `VirtualLesson` + join URL (**Start live**) |

### 7.5 Admissions (public apply + `AdminAdmissionsPage` pipeline)

Public (rate-limited, captcha P2):

| Method & path | Notes |
|---|---|
| `POST /public/admissions/apply` | `{ applicantName, dob, classSought, guardianName, guardianPhone, guardianEmail? }` → `201 { applicationId, nextSteps }` — **Apply Now** |
| `POST /public/admissions/:id/documents` | `multipart` birth cert / report / photo (5 MB each) |
| `GET /public/admissions/requirements` | Entry requirements per level — Admissions page |
| `GET /public/admissions/dates` | Deadlines, assessment date, resumption |

Staff pipeline (`admissions, admin`):

| Method & path | Powers |
|---|---|
| `GET /admissions?stage=&classSought=&search=` | Queue table + 4 tiles (enquiries/interviews/offers/enrolled) |
| `GET /admissions/:id` / `PATCH /admissions/:id` | Review, `stage`, `entranceScore`, `notes` |
| `POST /admissions/:id/interview` | `{ at, venue }` → SMS/email invite |
| `POST /admissions/:id/offer` | Generates offer letter PDF + notifies guardian |
| `POST /admissions/:id/enroll` | **Atomic:** creates `Student` + guardian `User`s + first `Invoice` → returns `studentCode` |

### 7.6 Assignments & submissions

Teacher (`TeacherAssignmentsPage`):

| Method & path | Notes |
|---|---|
| `GET /assignments?classId=&status=&mine=1` 🔒 | Teacher table (submitted x/y computed) |
| `POST /assignments` 🔒 | teacher own classes; `{ title, instructions?, classId, subjectId, dueAt(future), maxScore?, attachment? }` → `201`. Admin may post to any class |
| `GET /assignments/:id` / `PATCH /assignments/:id` / `DELETE /assignments/:id` 🔒 | Edit until first submission; delete only Draft |
| `GET /assignments/:id/submissions` 🔒 | Grading queue: pupil, file, submittedAt, late flag |
| `PATCH /submissions/:id/grade` 🔒 | `{ score ≤ maxScore, feedback? }` → status Graded, notifies pupil |
| `GET /assignments/export?classId=&termId=` 🔒 | CSV marks export (**Export marks**) |

Student (`StudentAssignmentsPage`):

| Method & path | Notes |
|---|---|
| `GET /my/assignments?status=` 🔒 | student; statuses `upcoming|submitted|late|graded` |
| `POST /my/assignments/:id/submit` 🔒 | student; `multipart { file, note? }`; resubmit allowed before `dueAt`; late accepted + flagged (configurable) |
| `GET /my/assignments/:id` 🔒 | Detail + teacher feedback + score |

Admin (`AdminAssignmentsPage`): `GET /admin/assignments/summary?termId=` → per-class completion % + workload; read-only monitor.

### 7.7 Results & report cards

Teacher entry (`TeacherResultsPage`):

| Method & path | Notes |
|---|---|
| `GET /results/entry?classId=&subjectId=&termId=` 🔒 | teacher own; draft grid (pupil × CA/exam) |
| `PUT /results/entry` 🔒 | teacher own; bulk upsert `[{ studentId, ca 0–30, exam 0–70 }]`; server computes `total, grade`; `422` if class closed |
| `POST /results/submit?classId=&subjectId=&termId=` 🔒 | teacher → status Draft→Submitted (locks editing; HOD/admin can unlock) |

Student (`StudentResultsPage`):

| Method & path | Notes |
|---|---|
| `GET /my/results?termId=` 🔒 | student; **published only**: subjects + CA/exam/total/grade/remark, average, position, attendance, teacher + principal remarks |
| `GET /my/results/report-card?termId=` 🔒 | PDF stream |

Admin (`AdminResultsPage`):

| Method & path | Notes |
|---|---|
| `GET /admin/results/broadsheets?termId=` 🔒 | Per-class average + status Ready/Needs correction |
| `POST /admin/results/:classId/approve` / `/publish` / `/unpublish` 🔒 | Approval chain; publish triggers parent/student notifications |

### 7.8 Fees & payments (StudentFeesPage + AdminFeesPage)

    again — `:invoiceId` endpoints are per-invoice so a pupil with split payments stays reconcilable.

| Method & path | Roles | Notes |
|---|---|---|
| `GET /fee-structures?programme=&termId=` | auth read; admin write | **Fee table** on Admissions page (public variant `GET /public/fees?programme=`) |
| `POST /fee-structures` / `PATCH /fee-structures/:id` 🔒 | admin, bursar | `{ programme, termId, tuitionKobo, registrationKobo, boardingKobo, otherKobo, dueDate }` |
| `GET /my/invoices` 🔒 | student, parent (child-scoped `?studentId=`) | **Fee history** table + 3 tiles (outstanding / paid-session / next-due) |
| `GET /my/invoices/:id` 🔒 | scoped | Line items + receipts |
| `POST /my/invoices/:id/pay` 🔒 | student/parent | `{ amountKobo, provider: paystack }` → `201 { paymentId, authorizationUrl }` — **Pay now** |
| `GET /payments/verify?reference=` 🔒 | payer | Poll after redirect; confirms + links receipt |
| `POST /webhooks/paystack` | provider-signed | Source of truth for confirm (`Confirmed` + receipt PDF + SMS). Verify signature, idempotent on `txnRef` |
| `GET /invoices?status=&classId=&search=` 🔒 | admin, bursar | **Admin directory** + 4 tiles (expected/collected/outstanding/overdue>30d) |
| `POST /invoices` 🔒 | admin, bursar | Raise single/bulk invoices for term |
| `GET /payments?status=&from=&to=` 🔒 | admin, bursar | **Transactions** table |
| `POST /payments/:id/confirm` 🔒 | admin, bursar | Confirm cash/transfer at office (dual-control P2) |
| `POST /invoices/remind` 🔒 | admin, bursar | `{ classId?|overdueOnly, channel: sms+email }` → queued jobs — **Send reminders (96)** |
| `GET /invoices/export?termId=&format=csv` 🔒 | admin, bursar | **Export ledger** |
| `GET /invoices/:id/receipt` 🔒 | scoped | PDF receipt — **Download invoice/receipt** |

### 7.9 Attendance (needed by tiles; no dedicated UI page yet — add P2)

| Method & path | Roles | Notes |
|---|---|---|
| `POST /attendance/mark` 🔒 | teacher own, admin | `{ classId, date, records: [{ studentId, status }] }` idempotent per day |
| `GET /attendance?classId=&from=&to=` 🔒 | scoped | History + % (Student 96% tile, Admin 94% tile) |
| `GET /students/:id/attendance?termId=` 🔒 | scoped | Per-pupil trend for report card |

### 7.10 Virtual classes (Student + Admin pages)

| Method & path | Roles | Notes |
|---|---|---|
| `GET /virtual-lessons?mine=1&from=&to=` 🔒 | student (own classes), teacher, admin | Scheduled cards: topic/teacher/time/duration/status |
| `POST /virtual-lessons` 🔒 | teacher own, admin | `{ title, topic, subjectId, classId, startsAt(future), durationMins, joinUrl?, notes? }` — **Schedule class** |
| `GET /virtual-lessons/:id` / `PATCH /virtual-lessons/:id` / `DELETE /virtual-lessons/:id` 🔒 | owner/admin | Attach `notesUrl`, `recordingUrl` post-lesson |
| `GET /virtual-lessons/live` 🔒 | student | **Live-now banner** (status=Live, own classes) |
| `POST /virtual-lessons/:id/attendance` 🔒 | teacher | Join log → attendance assist |

### 7.11 CMS — public site + `AdminNewsPage` (+ future gallery/services editors)

Public (cached 60 s, no auth):

```
GET /public/hero-slides
GET /public/stats
GET /public/programmes            GET /public/programmes/:slug
GET /public/services              GET /public/services/:slug
GET /public/facilities
GET /public/student-life
GET /public/news?category=&search=      GET /public/news/:slug
GET /public/events?upcoming=1
GET /public/gallery?category=
GET /public/staff
GET /public/faqs?scope=academics|admissions|general
GET /public/testimonials
GET /public/settings                # address, phones, email, hours (Footer/Contact)
POST /public/contact                 # contact form → ContactEnquiry + email to office
```

Admin CMS (`admin`): full CRUD on each:

```
CRUD /cms/hero-slides  /cms/programmes  /cms/services  /cms/facilities
CRUD /cms/news  (+ POST /cms/news/:id/publish|unpublish)   # AdminNewsPage
CRUD /cms/events  /cms/gallery  /cms/staff  /cms/faqs  /cms/testimonials
GET  /contact-enquiries  PATCH /contact-enquiries/:id   # office inbox
```

News article schema: `{ title, slug, category, excerpt, body(markdown), coverUrl, author, publishedAt, isPublished }`. Gallery: `{ url, category, caption, takenAt }`.

### 7.12 Documents & uploads

| Method & path | Notes |
|---|---|
| `POST /uploads` 🔒 | `multipart` → `{ url, key, size, mime }`; private-by-default ACL; signed URLs (15 min) for report cards/receipts |
| `GET /my/documents?termId=` 🔒 | student: report cards, receipts, admission docs (**Documents** per product spec) |

### 7.13 Messaging/notifications (bell + P2 threads)

MVP: announcements + notifications only (no free-form chat — avoids moderation scope).

| Method & path | Notes |
|---|---|
| `GET /announcements?audience=` 🔒 | Scoped feed (Student dashboard "Announcements") |
| `POST /announcements` 🔒 | admin; `{ title, body, category, audience, publishAt? }` |
| `GET /notifications` + `PATCH /notifications/:id/read` + `POST /notifications/read-all` 🔒 | Grades published, fee receipt, admission offer, class starting |

P2: `MessageThread` endpoints (parent↔teacher, office inbox) with abuse-report + retention policy.

### 7.14 Reports & exports (admin)

```
GET /reports/overview?termId=                    # one payload for AdminDashboard
GET /reports/fees?termId=&groupBy=programme      # CSV/PDF
GET /reports/results?termId=&classId=
GET /reports/attendance?from=&to=&classId=
GET /reports/admissions?from=&to=
GET /reports/staff-workload?termId=
```

All support `?format=csv|pdf` (default JSON). Generate async for >5k rows → `202 { jobId }` + `GET /jobs/:id` download link.

### 7.15 Settings (`AdminSettingsPage`)

| Method & path | Notes |
|---|---|
| `GET /settings` / `PATCH /settings` 🔒 admin | `{ school: { name, address, phones[], email, logoUrl }, session: { currentTermId, termDates, midtermBreak }, grading: thresholds, payments: { paystackPublicKey, lateFeeKobo }, portal: { roles[] } }` |
| `GET /settings/roles` / `PATCH /settings/roles/:role` 🔒 super_admin | Permission toggles backing the Roles & access card |

---

## 8. Request/response examples (copy-paste contracts)

**Bulk score entry** — `PUT /results/entry`:

```json
{ "classId": "uuid", "subjectId": "uuid", "termId": "uuid",
  "entries": [{ "studentId": "uuid", "ca": 28, "exam": 62 }] }
// 200 → { "data": { "saved": 42, "average": 81.2, "status": "Draft" } }
// 422 → { "error": { "code": "TERM_CLOSED", "message": "Term is locked for editing" } }
```

**Assignment submit** — `POST /my/assignments/:id/submit` (`multipart/form-data`):
`file=<pdf|doc|jpg ≤10MB>`, `note="…" (optional)` →
`201 { "data": { "submissionId": "uuid", "status": "Submitted", "submittedAt": "2026-10-06T14:02:00Z", "isLate": false } }`

**Invoice pay init** — `POST /my/invoices/:id/pay`:
`{ "amountKobo": 4500000, "provider": "paystack" }` →
`201 { "data": { "paymentId": "uuid", "txnRef": "TXN-90413", "authorizationUrl": "https://checkout.paystack.com/…" } }`

---

## 9. Validation rules (server-side, exhaustive)

- Emails lowercase + unique; phones E.164 (`+234…`); codes match `^LWU\/\d{4}\/\d{4}$` (students) / `^LWU\/T\/\d{3}$` (staff).
- `dueAt/startsAt` must be future on create; `ca 0–30`, `exam 0–70`, `score ≤ maxScore`.
- Invoice pay: `1 ≤ amountKobo ≤ balanceKobo`; no double-confirm (idempotency key `txnRef`).
- Uploads: MIME allowlist + 10 MB (docs 5 MB); filename sanitized; signed-URL expiry.
- Admissions: guardian phone required; classSought ∈ offered levels; duplicate phone+name within 30 days → `409` with existing ref.

---

## 10. Frontend wiring map (replace mocks file-by-file)

| Frontend file | Mock to delete | Endpoints to call |
|---|---|---|
| `src/data/dashboard.ts` (`studentOverview`, `studentFees`, `studentResults`, `studentAssignments`, `virtualClasses`, `teacherOverview`, `adminOverview`) | entire mock block | §7.1–7.10 per row below |
| `StudentDashboardPage.tsx` | `studentOverview`, slice of `studentAssignments`, `virtualClasses` | `GET /me/overview`, `GET /me/timetable?day=today`, `GET /my/assignments?status=upcoming&limit=3`, `GET /virtual-lessons?mine=1&upcoming=1` |
| `StudentFeesPage.tsx` | `studentFees` | `GET /my/invoices`, `POST /my/invoices/:id/pay`, `GET /invoices/:id/receipt` |
| `StudentResultsPage.tsx` | `studentResults` | `GET /my/results?termId=`, `GET /my/results/report-card?termId=` |
| `StudentAssignmentsPage.tsx` | `studentAssignments` | `GET /my/assignments`, `POST /my/assignments/:id/submit` |
| `StudentVirtualClassPage.tsx` | `virtualClasses` | `GET /virtual-lessons/live`, `GET /virtual-lessons?mine=1` |
| `TeacherDashboardPage.tsx` | `teacherOverview` | `GET /teacher/overview`, `GET /assignments?mine=1&status=collecting`, `GET /me/timetable?day=` |
| `TeacherAssignmentsPage.tsx` | local `assignments` const | `POST /assignments`, `GET /assignments?mine=1`, `GET /assignments/:id/submissions`, `PATCH /submissions/:id/grade`, `GET /assignments/export` |
| `TeacherResultsPage.tsx` | local `classResults` | `GET /results/entry?…`, `PUT /results/entry`, `POST /results/submit?…` |
| `TeacherClassesPage.tsx` | local `classes` | `GET /teacher/classes`, `POST /teacher/classes/:id/live`, `GET /classes/:id/pupils` |
| `AdminDashboardPage.tsx` | `adminOverview` + inline arrays | `GET /reports/overview?termId=`, `GET /admissions?limit=3` |
| `AdminStudentsPage.tsx` | local `rows` | `GET /students?…`, `POST /students` |
| `AdminTeachersPage.tsx` | local `staff` | `GET /staff?…`, `POST /staff` |
| `AdminAdmissionsPage.tsx` | local `apps` | `GET /admissions?…`, `POST /admissions/:id/{interview,offer,enroll}` |
| `AdminFeesPage.tsx` | local `txns` | `GET /invoices?…`, `GET /payments?…`, `POST /invoices/remind`, `GET /invoices/export` |
| `AdminResultsPage.tsx` | inline broadsheets | `GET /admin/results/broadsheets?termId=`, `POST /admin/results/:classId/{approve,publish}` |
| `AdminAssignmentsPage.tsx` | inline rows | `GET /admin/assignments/summary?termId=` |
| `AdminVirtualClassPage.tsx` | inline rows | `GET /virtual-lessons?…`, `POST /virtual-lessons` |
| `AdminNewsPage.tsx` | local `seed` | `CRUD /cms/news`, `POST /cms/news/:id/publish|unpublish` |
| `AdminSettingsPage.tsx` | defaults in JSX | `GET /settings`, `PATCH /settings`, `GET /settings/roles` |
| `LoginPage.tsx` | `notice=true` fake submit | `POST /auth/login`, `POST /auth/recovery/request` |
| Public pages (`Home/About/…`) | `src/data/*.ts` | `GET /public/*` (§7.11); keep files as fallback until CMS live |

Auth wiring: axios/fetch interceptor → attach `accessToken`, on `401` call `POST /auth/refresh` once then retry; on refresh-fail redirect `/login`. Route guards: `student/*` requires role student|parent-link|admin-override; `teacher/*` teacher|admin; `admin/*` admin|super_admin|scoped (bursar→fees, admissions→admissions).

---

## 11. Non-functional requirements

- **Security:** Argon2id; JWT RS256; httpOnly+Secure+SameSite refresh cookies; CORS allowlist (site + vercel preview); Helmet headers; PII encryption at rest for DOB; audit log on all admin writes, password resets, payment confirms, result publishes.
- **Performance:** `GET /public/*` cached (Redis 60 s + CDN); DB indexes on `(studentId, termId)`, `(classId, date)`, `code`, `txnRef`; N+1 eliminated via Prisma `include`; p95 < 300 ms for lists.
- **Reliability:** Idempotent webhooks + pay-init keys; invoice/payment updates in DB transactions; nightly pg_dump + WAL archiving; RPO 24 h / RTO 4 h.
- **Observability:** Request-id logging, `/healthz` + `/readyz`, Sentry errors, UptimeRobot on login + pay-verify.
- **Accessibility/i18n:** API returns raw values (kobo, ISO dates); formatting (₦, Africa/Lagos) stays in frontend per existing UI.

---

## 12. Environments & config

```bash
DATABASE_URL=postgres://…
REDIS_URL=redis://…
JWT_ACCESS_SECRET=…          JWT_REFRESH_SECRET=…
PAYSTACK_SECRET_KEY=…       PAYSTACK_PUBLIC_KEY=…
S3_ENDPOINT=…  S3_BUCKET=…  S3_ACCESS_KEY=…  S3_SECRET_KEY=…  CDN_URL=…
SMS_API_KEY=…               SMTP_URL=…
FRONTEND_URL=https://learnwithuncletee.org
```

Envs: `local` (docker-compose pg+redis) → `staging` (seeded demo: 42 JSS-2 pupils incl. Daniel E., staff Balogun/Okoye/Ibrahim/Eze) → `production`.

---

## 13. Build order (MVP-first, matches existing UI)

1. **P0 — Auth + Me + Roles** (§4, §6): unblocks all portals; Login page goes live.
2. **P0 — Academic core** (sessions/terms/classes/subjects/timetable): unblocks every dashboard tile.
3. **P0 — Students/Staff CRUD + CMS read (`/public/*`)**: public site becomes dynamic; admin directories work.
4. **P1 — Assignments + Results**: student/teacher core loop (submit → grade → publish → report card).
5. **P1 — Fees + Paystack + Admissions enroll**: money + intake.
6. **P2 — Virtual lessons, notifications, attendance history, reports/exports, messages, settings-roles.**

Acceptance per phase: each frontend page in §10 renders zero-mock data; `tsc` + smoke test (login as each role → visit every sidebar link → 200s) green.

---

## 14. Open questions for the school (block grading/money accuracy)

1. Grading thresholds + CA/exam split (currently assumed 30/70)?
2. Fee amounts per programme/term + late-fee policy?
3. Paystack merchant account owner + settlement account?
4. Result publishing approver (HOD vs principal) + correction window?
5. Late-submission policy (accept + flag vs reject)?
6. Official class list, rooms, capacity, entry requirements per level?
7. SMS sender ID + who pays per-message costs?

---

## Appendix A — Full route table (alphabetical, implementation checklist)

```
POST /admissions/:id/enroll  PATCH /admissions/:id  GET /admissions  GET /admissions/:id
POST /admissions/:id/interview  POST /admissions/:id/offer
GET  /admin/assignments/summary  GET /admin/overview
GET  /admin/results/broadsheets  POST /admin/results/:classId/approve|publish|unpublish
CRUD /announcements (GET scoped, POST admin)
POST /assignments  GET /assignments  GET|PATCH|DELETE /assignments/:id
GET  /assignments/:id/submissions  GET /assignments/export
POST /attendance/mark  GET /attendance
POST /auth/login|refresh|logout  POST /auth/recovery/request|confirm
GET  /auth/me  PATCH /auth/me/password
GET  /classes  POST /classes  GET|PATCH /classes/:id  GET /classes/:id/pupils
CRUD /cms/events|faqs|facilities|gallery|hero-slides|news|programmes|services|staff|testimonials
POST /cms/news/:id/publish|unpublish
GET  /contact-enquiries  PATCH /contact-enquiries/:id
POST /fee-structures  PATCH /fee-structures/:id  GET /fee-structures
GET  /invoices  POST /invoices  GET /invoices/:id/receipt  POST /invoices/remind  GET /invoices/export
GET  /me/overview  GET /me/timetable  GET /me/upcoming
GET  /my/assignments  POST /my/assignments/:id/submit  GET /my/assignments/:id
GET  /my/documents  GET /my/invoices  GET|POST /my/invoices/:id/pay
GET  /my/results  GET /my/results/report-card
GET  /notifications  PATCH /notifications/:id/read  POST /notifications/read-all
GET  /payments  POST /payments/:id/confirm  GET /payments/verify
POST /public/admissions/apply  POST /public/admissions/:id/documents
GET  /public/admissions/dates|requirements
GET  /public/events|facilities|faqs|gallery|hero-slides|news|news/:slug|programmes|programmes/:slug
GET  /public/services|services/:slug|settings|staff|stats|student-life|testimonials
POST /public/contact  GET /public/fees
GET  /reports/attendance|admissions|fees|overview|results|staff-workload
PUT  /results/entry  GET /results/entry  POST /results/submit
GET  /sessions  POST|PATCH /sessions/:id  (+ terms equivalents)
GET  /settings  PATCH /settings  GET|PATCH /settings/roles
GET  /staff  POST /staff  GET|PATCH /staff/:id
GET  /students  POST /students  GET|PATCH /students/:id
POST /students/:id/guardians  PATCH /students/:id/status  GET /students/:id/attendance|report-card
GET  /subjects  POST|PATCH /subjects/:id
GET  /teacher/classes  POST /teacher/classes/:id/live  GET /teacher/overview
GET  /timetable  POST /timetable|/bulk  PATCH|DELETE /timetable/:id
POST /uploads  GET /virtual-lessons|/live  POST /virtual-lessons
GET|PATCH|DELETE /virtual-lessons/:id  POST /virtual-lessons/:id/attendance
POST /webhooks/paystack  GET /healthz|/readyz  GET /jobs/:id
```

*End of plan. Next step: scaffold NestJS modules in §13 order and generate OpenAPI from this file.*
