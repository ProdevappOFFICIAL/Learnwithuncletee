# LearningDeck Exam Manager API Documentation

## Base URL
`http://localhost:3000/api`

## Response Format
All responses follow a standard structure:

### Success Response
```json
{
  "success": true,
  "message": "Optional feedback message",
  "data": { ... } // or [ ... ] for lists
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error details here"
}
```

---

## 1. Authentication
Endpoints for managing user sessions.

### POST `/auth/register`
Register a new user.
- **Body**: 
  ```json
  {
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "user_password": "securepassword",
    "workspaceId": 1,
    "classId": 2, // Optional, required for students
    "role": "STUDENT" // "ADMIN" | "TEACHER" | "STUDENT"
  }
  ```
- **Response**: `data` contains `{ user: User, token: string }`.

### POST `/auth/login`
Authenticate and get a token.
- **Body**: `{ "user_email": "john@example.com", "user_password": "securepassword" }`
- **Response**: `data` contains `{ user: User, token: string }`.

### POST `/auth/logout`
Invalidate the current session (frontend should clear token).

---

## 2. Workspaces
Manage high-level organizations.

### POST `/workspaces`
Create a workspace.
- **Body**: `{ "name": "string", "description": "string" (optional) }`

### GET `/workspaces`
List all workspaces with counts of associated entities.

### GET `/workspaces/:id`
Get workspace details including lists of users, exams, subjects, and classes.

### PUT `/workspaces/:id`
Update workspace name or description.

### DELETE `/workspaces/:id`
Remove workspace and all associated data.

---

## 3. Users
Manage administrators, teachers, and students.

### GET `/users`
List users.
- **Query Params**: `role`, `workspaceId`, `classId` (all optional).

### GET `/users/:id`
Get user profile including their `results`.

### PUT `/users/:id`
Update user information (name, email, password, active status, etc.).

### DELETE `/users/:id`
Remove a user.

---

## 4. Classes
Manage student groups.

### POST `/classes`
Create a class.
- **Body**: `{ "name": "Grade 10-A", "workspaceId": 1 }`

### GET `/classes`
List classes.
- **Query Params**: `workspaceId` (optional).

### GET `/classes/:id`
Get class details including associated users, exams, and subjects.

---

## 5. Subjects
Manage academic courses.

### POST `/subjects`
Create a subject.
- **Body**: `{ "name": "Mathematics", "workspaceId": 1 }`

### GET `/subjects`
List subjects.
- **Query Params**: `workspaceId` (optional).

### GET `/subjects/:id`
Get subject details including classes and question bank.

---

## 6. Exams
Manage examinations.

### POST `/exams`
Create an exam.
- **Body**: 
  ```json
  {
    "exam_name": "Midterm Exam",
    "minutes": 60,
    "workspaceId": 1,
    "classId": 2
  }
  ```

### GET `/exams`
List exams.
- **Query Params**: `workspaceId`, `classId` (optional).

### GET `/exams/:id`
Get exam details including questions and results.

---

## 7. Questions
Manage the question bank.

### POST `/questions`
Add a question to an exam.
- **Body**: 
  ```json
  {
    "type": "MULTIPLE_CHOICE", // "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_IN_THE_BLANK"
    "question": "What is 2+2?",
    "correct_answer": "4",
    "incorrect_answers": ["3", "5", "6"],
    "explanation": "Basic addition",
    "img": "url_to_image", // Optional
    "examId": 1,
    "subjectId": 2,
    "classId": 3
  }
  ```

### GET `/questions`
List questions.
- **Query Params**: `examId`, `subjectId`, `classId`, `type` (optional).

---

## 8. Results
Handle exam submissions and performance tracking.

### POST `/results`
Submit a completed exam attempt.
- **Body**: 
  ```json
  {
    "overallScore": 85.5,
    "subjectScores": { "MATHS": { "correct": 10, "total": 12 } },
    "attempted_questions": 12,
    "total_questions": 15,
    "userId": 1,
    "examId": 1,
    "questionAttempts": [
      {
        "questionId": 1,
        "visited": true,
        "attempted": true,
        "options": ["Option A", "Option B"], 
        "userOption": 0,
        "userTextAnswer": null
      }
    ]
  }
  ```

### GET `/results`
List results.
- **Query Params**: `userId`, `examId` (optional).

### GET `/results/:id`
Get detailed result including all `questionAttempts` and the full `question` objects.

### GET `/results/user/:userId`
Get all results for a specific student.

---

## Data Models (Reference)

### User
```ts
{
  id: number;
  user_name: string;
  user_email: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  active: boolean;
  workspaceId: number;
  classId: number | null;
  img: string | null;
  createdAt: string;
}
```

### Question
```ts
{
  id: number;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_IN_THE_BLANK";
  question: string; // Markdown/HTML supported
  correct_answer: string;
  incorrect_answers: string[];
  explanation: string | null;
  img: string | null;
  examId: number;
  subjectId: number;
  classId: number;
}
```

### Result
```ts
{
  id: number;
  overallScore: number;
  subjectScores: any; // Record<string, { correct: number, total: number }>
  attempted_questions: number;
  total_questions: number;
  date: string;
  userId: number;
  examId: number;
  questionAttempts: QuestionAttempt[];
}
```
