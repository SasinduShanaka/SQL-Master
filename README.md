# SQL Master

Web application to help students learn and practice SQL from beginner to advanced.

Database:
- MongoDB powers auth, progress, lesson content, and quiz content.

Backend environment:

Create `backend/.env` with your MongoDB connection string:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/sql_master
PORT=5000
```

The API still starts without `MONGODB_URI`; in that mode the frontend keeps progress in browser storage until MongoDB is available.

Folders:
- `backend/` — Express API and services
- `frontend/` — Vite + React UI

Quick start:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```
