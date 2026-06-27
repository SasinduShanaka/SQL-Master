# SQL Master — Backend

Quick start for the backend API (Express + optional OpenAI content generation):

Install dependencies:

```bash
cd backend
npm install
```

Run in development (requires `nodemon`):

```bash
npm run dev
```

Environment variables: copy `.env.example` to `.env` and configure `OPENAI_API_KEY`.
Optional settings: `OPENAI_MODEL` and `OPENAI_BASE_URL`.

If no OpenAI key is provided, the backend falls back to a built-in SQL curriculum so the app still works locally.
