# SQL Master API

Requires Node.js 22.13 or newer.

```sh
npm install
npm run seed
npm run dev
```

The local SQLite content database is seeded automatically at startup as well. It stores 1,212 practice questions, 60 interview questions, and five business datasets. The original three teaching tables remain available.

- `GET /api/exercises`: paginated practice questions.
- `GET /api/exercises?track=interview`: interview questions.
- Optional filters: `level`, `topic`, `role`, `search`, `page`, `limit` (maximum 100).
- `GET /api/exercises/:id`: one question with hints and a reference solution.
- `GET /api/catalog`: roadmap and library counts.
- `GET /api/tables`: schemas, row counts, and eight sample rows per table.
- `POST /api/sql/execute`: execute SQL against a fresh copy of all eight tables.

Set `SQLMASTER_CONTENT_DB` to override the SQLite file location. MongoDB (`MONGODB_URI`, or legacy `MONGO_URI`) is required for account features. Run `npm run db:accounts` to create the users and sessions collections and indexes. Optional Groq settings enable generated hints. See the root README for setup and SQL dialect limitations.

Run `npm test` to validate the full question bank and API behavior.


## Account API

- `POST /api/auth/register`: `{ name, email, password }`.
- `POST /api/auth/login`: `{ email, password }`.
- `GET /api/auth/me`: signed-in account, progress, XP, badges, and flags.
- `POST /api/auth/logout`: revoke the current session.
- `GET /api/progress`: personal progress summary.
- `POST /api/progress/lessons/:id`: `{ status: "in-progress" | "completed" }`.
- `POST /api/quizzes/:id/submit`: `{ answerIndex }`.
- `POST /api/exercises/:id/submit`: `{ sql }` for graded answers and XP.
- `PUT /api/progress/flags/:id`: `{ flagged: true | false }`.
- `DELETE /api/progress`: reset the current account's progress.

Account mutation requests require the session cookie (except registration/login) and `x-sqlmaster-request: 1`. Use a same-origin frontend proxy. User IDs and score values supplied by clients cannot grant access or points. Old anonymous learner headers are not used.

The API query runner uses isolated, read-only SQLite processes. The original AlaSQL helper is used only by legacy tests. Default authentication HTTP tests use model doubles; opt into real MongoDB testing as described in the root README.
