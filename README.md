# SQL Master

A SQL learning workspace with a guided beginner-to-advanced curriculum, query editor, database reference, quizzes, and progress tracking.

## Run locally

Use Node.js 22.13 or newer (the backend uses built-in SQLite). Start each service in its own terminal:

```sh
cd backend
npm install
npm run dev
```

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite forwards API requests to port 5000.

## Features

- Twelve lessons and 1,212 practice questions, organized into three difficulty levels.
- A separate interview exam section with 60 original SQL job interview challenges, role filters, suggested times, and reference solutions.
- Five new business tables containing 2,875 records, alongside the original three teaching tables.
- SELECT, filtering, sorting, DISTINCT, aggregation, joins, subqueries, CTEs, CASE, and reporting.
- SQL editor with Ctrl/Cmd+Enter execution, hints, table results, and database previews.
- Responsive workspace navigation, lesson completion, and quiz feedback.
- MongoDB user accounts with registration, login, personal progress, XP, badges, and saved question flags.
- Built-in lessons remain readable when the backend is unavailable.

The introductory curriculum lives in `shared/curriculum.json`. `backend/data/library.js` generates 1,200 additional practice questions using ten query patterns across ten regions and twelve months, plus 60 interview questions using six patterns across ten regions. These are parameterized scenario variants, not 1,272 unrelated SQL concepts. Each has a distinct prompt and reference query tested against its data.

### Question database

The backend automatically seeds `backend/data/content.sqlite` with 1,272 question records and five dataset records containing the new sample rows. It reads questions and filters from SQLite, and loads the stored datasets into each isolated SQL execution. MongoDB configuration is not needed for question storage.

To seed or refresh the database explicitly:

```sh
cd backend
npm run seed
```

Seeding is transactional and repeatable. It upserts the bundled IDs without deleting unrelated records. The database is local generated data and is excluded from Git; deploy the generator and run the backend or seed command to recreate it. Set `SQLMASTER_CONTENT_DB` to choose another writable location. MongoDB is required for registration, login, and personal progress. Browsing lessons and running practice queries remain available without an account.

Use `#/interviews` for **Practice for interview exams**. Search by scenario, region, or month; narrow interview questions by Data analyst, Data engineer, or SQL developer. Reference solutions are available on request. Suggested times are guidance, not an enforced exam timer. Submit answer checks the result and awards account XP on the first accepted solution.

## Configuration

Copy `backend/.env.example` to `backend/.env` and configure MongoDB to enable accounts:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/sql_master
# Optional AI hints:
# GROQ_API_KEY=your_key
```

MongoDB stores authenticated users and sessions. Set `MONGODB_URI` in the saved `backend/.env` file (`MONGO_URI` is also accepted for compatibility). The backend always loads this file regardless of the command's working directory. AI hints fall back to built-in guidance if the provider is unavailable.

## Accounts, scores, badges, and flags

```sh
cd backend
npm run db:accounts
npm run dev
```

`db:accounts` connects to the configured MongoDB and initializes the `users` and `sessions` collections and indexes. It does not create a default account. Use Register in the app to create your own user.

- `users`: name, unique normalized email, salted scrypt password hash, completed/started lesson IDs, passed quizzes, quiz results, solved question IDs, and flagged question IDs.
- `sessions`: a hash of an opaque session token, user reference, and seven-day expiry. Expired sessions are rejected immediately; a MongoDB TTL index removes old records.
- Authentication uses HttpOnly, SameSite=Strict cookies. Production (`NODE_ENV=production`) enables Secure cookies and requires HTTPS. Serve the frontend and `/api` through the same origin; Vite's existing proxy does this locally.
- Passwords require 12-128 characters. Password reset and email verification are not included in this version.
- Registration asks you to confirm your password. Login returns you to the learning page you came from; account requests and logout are serialized to prevent overlapping session changes.
- XP is calculated on the server: 10 per self-reported lesson completion, 20 per first quiz pass, and 25/50/100 per first accepted beginner/intermediate/advanced question. Repeated submissions do not add points. Each 250 XP advances a level.
- Eight badges are derived from milestones. Flags are personal bookmarks; open them from My progress.
- SQL grading compares column names and result rows, including duplicates and requested ordering. It checks the supplied dataset, not correctness on every possible dataset. Reference solutions are available for learning.
- Anonymous `x-learner-id` access and client-supplied progress/score replacement have been removed. Existing browser-only/legacy progress is left untouched and is not automatically attributed to a new account.
- Reset progress clears the signed-in user's scores, badges, completions, quiz results, and flags after confirmation.

The authentication limiter is process-local. A multi-instance deployment should use a shared rate-limit store at the gateway or application layer.

## SQL support

The browser query runner and answer grader use SQLite in a fresh, read-only database per request. Each request runs in a separate process with an eight-second time limit and a 5,000-row result limit. Up to four queries run concurrently. The interface previews the first 100 returned rows. The original AlaSQL helper remains for legacy curriculum regression checks; the API does not evaluate user SQL as JavaScript.

## Verification

```sh
cd backend
npm test
```

```sh
cd frontend
npm run build
```


### Authentication integration tests

Default tests cover password/session HTTP behavior with model doubles and all reference SQL solutions. The real MongoDB integration test is opt-in and uses a disposable MongoDB process, never the application's configured database:

```powershell
$env:RUN_MONGO_TESTS = '1'
npm run test:auth
```

Run from `backend`. This downloads MongoDB on first use. To use an already installed binary instead, set `MONGOMS_SYSTEM_BINARY` to the absolute path of `mongod.exe`. The real integration test reports a skip when neither setting is provided.

Implementation references: [Node.js scrypt](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback) and [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
