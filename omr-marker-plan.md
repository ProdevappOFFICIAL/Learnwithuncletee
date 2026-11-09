# OMR / PPT Marker — Deep Implementation Plan

## 1. Product goal

Turn the placeholder **PPT Marker** page into a working OMR workflow for the
Uncle Tee paper-and-pen exam sheet:

1. An admin builds an **answer key**: subject names (Use of English, Physics,
   Chemistry, Bio/Maths), 40 questions per subject, options A–D.
2. An invigilator photographs a completed sheet with a phone (or uploads an
   image).
3. The **backend** rectifies the page, detects every bubble, reads the shaded
   answers, scores them against the key and returns a reviewable result.
4. The reviewer confirms/edits the student details and any misread answers,
   then saves the marks.
5. The marks are stored against the answer key and visible in the scan
   history.

Everything image-related runs on the API server. The browser only captures or
uploads the photo and renders the result (no OpenCV/WebAssembly in the client).

## 2. Physical sheet assumptions

The supplied sheet has:

- a header block with handwritten fields: name, university, email, first
  choice, guardian telephone, personal numbers, alumni yes/no;
- four subject columns, left → right:
  **Use of English, Physics, Chemistry, Bio/Maths**;
- A–D bubble rows under each subject. The printed row numbers on the sample
  are partly wrong/duplicated, so **row position is the source of truth**,
  not the printed number.

Consequences:

- The answer key's subject order must match the sheet's left → right order.
  Subject names are free-form/custom, but the column count and order matter.
- Questions are mapped **top → bottom** from row 1.
- Handwritten fields are read by a vision model from separated header crops,
  then confirmed by a human on the review screen. The crop is always shown so
  a wrong AI guess cannot silently corrupt a student's details.

## 3. Architecture

```
React page (Vite app)
  └─ POST /api/omr/scans { answerKeyId, image: dataURL }
        └─ Express controller
             └─ OmrService  ── Prisma (keys, scans)
                  └─ OmrEngine (sharp + opencv-wasm)
                       1. decode / EXIF-rotate / resize
                       2. page detection + perspective warp
                       3. bubble-grid detection
                       4. fill measurement + answer classification
                       5. header/preview crops + annotation
             └─ writes JPEGs to api/uploads/omr/
             └─ returns detection + scores + review images
  └─ PATCH /api/omr/scans/:id  → confirm details / corrected answers
```

The engine is a pure function: `processSheet(buffer, subjectKeys)` returns
buffers + structured readings. It has no database access, which keeps it easy
to unit-test and to move to a worker later.

## 4. Data model (Prisma)

- `OmrAnswerKey` — workspace-owned key; title, session, active flag, creator.
- `OmrSubject` — ordered subjects belonging to a key; `questionCount`,
  `options Json` (A–D), `answers Json` (nullable option per question).
- `OmrScan` — one photographed sheet: workspace, key, uploader, status
  (`DRAFT | CONFIRMED | FAILED`), image paths, detection JSON, detected
  answers, scores, captured student details, reviewer/time.

Indexes: workspace + createdAt, key, student email. FKs cascade so deleting a
key removes its scans; deleting a scan removes its files in the service.

## 5. Image pipeline

### 5.1 Decode

`sharp(buffer, { limitInputPixels: 40_000_000 })`
- auto-rotate from EXIF (phone photos)
- resize longest edge to ≤ 2000 px
- raw sRGB → OpenCV `Mat`

### 5.2 Page detection

1. grayscale → blur → Canny(40, 120)
2. dilate 7×7 ×3 to join the border through print noise
3. largest external contour
4. `approxPolyDP` → if a convex 4-point quad is found use it (true
   perspective); otherwise use `minAreaRect` corners (rotation + scale)
5. reject if the area is < 35 % of the frame; otherwise warp to A4
   (1240 × 1754) with `warpPerspective`
6. if no page is found, use the frame as-is and flag
   `perspective: none` in the response

Phone guidance in the UI: place the sheet on a contrasting surface, fill the
frame, keep the camera parallel.

### 5.3 Bubble grid

Calibrated template priors derived from the supplied sheet (normalised to the
page, so they survive resizing):

- first option column x ≈ 0.0948 W
- option pitch ≈ 0.0379 W
- subject pitch ≈ 0.2465 W

Steps:

1. `HoughCircles` on the grayscale image with a radius window scaled to the
   page width. Loose thresholds (`param2 = 10`) are used because they must
   find ring outlines even when partially shaded.
2. Filter by radius near the median.
3. For each expected option column, take the median x of circles within
   ±0.018 W of the prior; fall back to the prior if too few are found.
4. Gather circle y positions near those columns; density-cluster them.
5. Discard tiny/huge clusters, keep the longest run separated by one row
   pitch, interpolate skipped rows.
6. Row count is discovered (30 on the sample, 40 on the physical sheet), not
   hard-coded.

If the grid is too weak, the scan is returned as `FAILED` with warnings so
the operator can retake the photo instead of storing nonsense.

### 5.4 Bubble reading

For every (subject, question, option) cell:

- annulus between 0.42 r and 0.80 r around the detected centre
  (excludes the printed ring and the printed letter);
- mean grayscale darkness = `1 - mean/255`;
- per row: sort the four darkness values.

Classification:

| Condition | Result |
|---|---|
| best < 0.42 | blank |
| best − second < 0.12 and second ≥ 0.42 | multiple (pick best, flag) |
| best < 0.55 | low confidence (pick best, flag) |
| otherwise | clear answer |

Synthetic tests: blank annulus darkness ≤ 0.21, filled ≥ 0.78 — a very wide
margin.

### 5.5 Header and preview

- Header crop: y 14–31 % of the page (full width), JPEG q80, returned as a
  data URL so the reviewer can read the handwriting.
- Preview: the rectified sheet with green rings around selected answers and
  amber rings around flagged rows, downscaled to 900 px.

## 6. Scoring

For each subject:

```
correct = count(detected[i] !== null && detected[i] === key.answers[i])
answered = count(detected[i] !== null)
total = key.questionCount
percentage = correct / total * 100
```

Scan totals sum across subjects. If fewer rows were detected than the key
expects, the missing questions count as blank and a warning is attached.
Corrected answers submitted on confirmation are validated and rescored on the
server; the client never writes a score directly.

## 6b. AI assist (DeepSeek vision)

OpenCV is deterministic and remains the primary bubble reader. A second,
optional AI pass handles what classical CV cannot do well: handwriting and a
second opinion on ambiguous shading.

**Stack (already installed, no new packages):**

- `ai` + `@ai-sdk/openai-compatible` (OpenRouter's OpenAI-compatible API)
- default model `deepseek/deepseek-v4-flash-vision-exp`
- key: `OPENROUTER_API_KEY` (or `OMR_AI_API_KEY`)
- overrides: `OMR_AI_MODEL`, `OMR_AI_BASE_URL`, `OMR_AI_DISABLED=true`

**Call 1 — header + subject names (one request, three images):**

1. the rectified header crop,
2. a close-up of the guardian / personal / alumni line,
3. the printed subject-header band.

The model returns strict JSON with: student name, university, email, first
choice, guardian phone, personal number, alumni yes/no, per-field confidence,
and the printed subject names left → right. Values are sanitised (phone digit
count, email shape, boolean coercion) before storage. The scan is still a draft
— the reviewer sees confidence badges and confirms.

**Call 2 — ambiguous bubble rows (only when needed):**

OpenCV flags `multiple`, `uncertain` or `lightly shaded` rows. Up to eight of
those rows are cropped (subject + question position) and sent in one request.
The model names the shaded option or says `MULTIPLE` / `BLANK`. A clear
high/medium-confidence answer overrides the OpenCV pick and is marked
`ai-corrected`; a disagreement is marked `ai-conflict`; blank/multiple AI
answers never erase a valid OpenCV reading. Ordinary blanks are not sent, so a
mostly-empty sheet does not burn credits.

**Reliability rules:**

- calls are serialized through an in-process queue to avoid OpenRouter
  in-flight-credit rejections;
- each call has a 60 s abort timeout and a capped output budget;
- any AI failure adds a warning and the scan continues with OpenCV + manual
  review — the API never fails because the AI is down;
- AI usage (tokens/model) and all suggestions are stored under
  `OmrScan.detection.ai` for auditability.

## 7. API

Base: `/api/omr` (auth required, `results.read` / `results.write`).

| Method | Path | Purpose |
|---|---|---|
| GET | `/keys` | list answer keys (+ subject preview, scan count) |
| POST | `/keys` | create a key + subjects |
| GET | `/keys/:id` | key detail |
| PUT | `/keys/:id` | replace key/subjects (blocked if confirmed scans exist? allowed; scans keep their stored scores) |
| DELETE | `/keys/:id` | delete key + scans + files |
| GET | `/scans` | paginated history (filter key/status/search) |
| POST | `/scans` | upload + process (JSON data URL, ≤ 15 MB decoded) |
| GET | `/scans/:id` | detail + review images |
| PATCH | `/scans/:id` | confirm/edit details or answers |
| DELETE | `/scans/:id` | delete scan + files |

All queries are workspace-scoped. Uploads are stored outside the web root and
served only as data URLs on authenticated detail responses.

## 8. Frontend

`AdminPPTMarkerPage` becomes a three-tab workspace:

1. **Answer keys**
   - list + create/edit modal
   - visual A–D bubble grid per subject (click to select, click again to
     clear), 40 rows by default, add/remove subjects
   - validation: names unique, every question may be left blank until the
     key is final
2. **Scan sheet**
   - choose key → camera/file input (`capture="environment"` on phones)
   - processing stages (upload → page → bubbles → scores)
   - header crop + student-detail form
   - per-subject score cards and per-question answer grid with correction
   - warnings (blank/multiple/low confidence, row mismatch)
   - “Confirm & save marks” / “Discard draft”
3. **History**
   - search, key/status filters, score, student, date
   - open a scan to review images and details; delete

Styling follows the existing dashboard tokens (`Card`, `PageHeader`, `Pill`,
`Modal`, `apiGet/apiPost/...`) and stays responsive.

## 9. Migration safety

A hand-written, idempotent migration is included:

- `CREATE TYPE ...` wrapped in `DO $$ ... duplicate_object ... $$`;
- `CREATE TABLE IF NOT EXISTS` for the three tables;
- `CREATE INDEX IF NOT EXISTS`;
- FK constraints added only when missing (guarded by `pg_constraint` checks).

This lets the migration be re-run on a database where part of it was applied
manually, without destructive statements. Once the Neon host is reachable:
`cd api && npx prisma migrate deploy`.

## 10. Failure handling

- unreadable/too-small image → 400 with a clear retake message;
- no page detected → process the frame and warn (still usable for scans);
- weak grid → scan saved as FAILED (or rejected) with warnings, no fake score;
- huge uploads → 413/400 before decoding;
- missing permissions → 403 from RBAC;
- cross-workspace ids → 404 (never reveal other schools' data).

## 11. Verification

- Engine test on the supplied sheet: 16 option columns, 30 answer rows,
  120/120 synthetic shaded bubbles correct, blank sheet produced 120 blanks
  with zero false positives.
- Document detection test: synthetic phone photo with a desk background,
  trapezoid and rotation → perspective corrected, 120/120 still correct.
- AI header test on a filled header crop: name, university, email, first
  choice and guardian phone extracted; printed subject names read correctly.
- AI ambiguous-row test: a row with two shaded bubbles returned `MULTIPLE`
  with high confidence and was kept flagged for the reviewer.
- `node node_modules/typescript/bin/tsc -p . --noEmit` in `api/`.
- `node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit` and
  `npm run build` at the app root.
- Manual: create key → photograph sheet → review → confirm → history.

## 12. Known limits / next steps

- DeepSeek vision is very good on clear print and reasonably good on neat
  handwriting, but it is an assistant, not an authority. Names, emails and
  phone numbers are always confirmed by a human before saving. If the model is
  unavailable the header crop remains the fallback.
- The template priors are for the four-subject Uncle Tee sheet. Custom subject
  **names** are supported; the physical sheet must expose the same number of
  columns in the key's order. Additional print templates should store their
  grid priors per answer key rather than editing code.
- CPU-bound OpenCV processing runs in the request; AI calls are serialized. A
  worker queue is the next step if several invigilators scan simultaneously.
- OpenRouter credit limits can throttle the AI pass. The queue and safe
  degradation prevent failed scans; set `OMR_AI_DISABLED=true` to run pure
  OpenCV, or point `OMR_AI_MODEL` at another vision model.
- Publishing OMR scores into the school results tables can be added later as
  an explicit “publish” action.
