const { DatabaseSync } = require('node:sqlite')
const { mkdirSync } = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { buildQuestions, buildDatasets } = require('../data/library')

let database
function getDatabase() {
  if (database) return database
  const filename = process.env.SQLMASTER_CONTENT_DB || path.join(__dirname, '../data/content.sqlite')
  if (filename !== ':memory:') mkdirSync(path.dirname(filename), { recursive: true })
  database = new DatabaseSync(filename)
  database.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY, track TEXT NOT NULL, level TEXT NOT NULL, topic TEXT NOT NULL,
      role TEXT NOT NULL, sort_order INTEGER NOT NULL, payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS questions_filters ON questions(track, level, topic);
    CREATE TABLE IF NOT EXISTS datasets (name TEXT PRIMARY KEY, payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS content_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `)
  const questions = buildQuestions()
  const datasets = buildDatasets()
  const hash = createHash('sha256').update(JSON.stringify({ questions, datasets })).digest('hex')
  if (database.prepare("SELECT value FROM content_meta WHERE key = 'seed_hash'").get()?.value !== hash) {
    const questionInsert = database.prepare('INSERT INTO questions VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET track=excluded.track, level=excluded.level, topic=excluded.topic, role=excluded.role, sort_order=excluded.sort_order, payload=excluded.payload')
    const datasetInsert = database.prepare('INSERT INTO datasets VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET payload=excluded.payload')
    database.exec('BEGIN')
    try {
      for (const q of questions) questionInsert.run(q.id, q.track, q.level, q.topic, q.role || '', q.order, JSON.stringify(q))
      for (const table of datasets) datasetInsert.run(table.name, JSON.stringify(table))
      database.prepare("INSERT INTO content_meta VALUES ('seed_hash', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(hash)
      database.exec('COMMIT')
    } catch (error) { database.exec('ROLLBACK'); database.close(); database = null; throw error }
  }
  return database
}

function getExercises({ track = 'practice', level, topic, role, search, page = 1, limit = 24 } = {}) {
  const db = getDatabase()
  const clauses = ['track = ?']
  const values = [track]
  for (const [key, value] of Object.entries({ level, topic, role })) {
    if (typeof value === 'string' && value) { clauses.push(`${key} = ?`); values.push(value) }
  }
  if (typeof search === 'string' && search.trim()) {
    clauses.push("instr(lower(json_extract(payload, '$.question')), ?) > 0")
    values.push(search.trim().toLowerCase().slice(0, 200))
  }
  const where = clauses.join(' AND ')
  const total = db.prepare(`SELECT COUNT(*) AS count FROM questions WHERE ${where}`).get(...values).count
  const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 24))
  const safePage = Math.min(Math.max(1, Math.ceil(total / safeLimit)), Math.max(1, Math.floor(Number(page)) || 1))
  const exercises = db.prepare(`SELECT payload FROM questions WHERE ${where} ORDER BY sort_order LIMIT ? OFFSET ?`).all(...values, safeLimit, (safePage - 1) * safeLimit).map(row => JSON.parse(row.payload))
  const topics = db.prepare('SELECT DISTINCT topic FROM questions WHERE track = ? ORDER BY topic').all(track).map(row => row.topic)
  const roles = db.prepare("SELECT DISTINCT role FROM questions WHERE track = ? AND role != '' ORDER BY role").all(track).map(row => row.role)
  return { exercises, total, page: safePage, limit: safeLimit, track, topics, roles, levels: ['beginner', 'intermediate', 'advanced'] }
}

function getExerciseById(id) {
  const row = getDatabase().prepare('SELECT payload FROM questions WHERE id = ?').get(id)
  return row ? JSON.parse(row.payload) : null
}

function getStoredDatasets() {
  return getDatabase().prepare('SELECT payload FROM datasets ORDER BY name').all().map(row => JSON.parse(row.payload))
}

function getLibraryStats() {
  const db = getDatabase()
  return {
    practice: db.prepare("SELECT COUNT(*) AS count FROM questions WHERE track = 'practice'").get().count,
    interview: db.prepare("SELECT COUNT(*) AS count FROM questions WHERE track = 'interview'").get().count,
    datasets: getStoredDatasets().length,
    rows: getStoredDatasets().reduce((sum, table) => sum + table.rows.length, 0)
  }
}

module.exports = { getDatabase, getExercises, getExerciseById, getStoredDatasets, getLibraryStats }
