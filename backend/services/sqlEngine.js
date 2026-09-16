const alasql = require('alasql')
const { getStoredDatasets } = require('./contentStore')

const demoTables = [
  {
    name: 'students',
    description: 'Student profiles and scores',
    columns: ['id', 'name', 'score', 'cohort'],
    rows: [
      { id: 1, name: 'Ava', score: 94, cohort: 'web' },
      { id: 2, name: 'Noah', score: 82, cohort: 'data' },
      { id: 3, name: 'Mia', score: 76, cohort: 'web' },
      { id: 4, name: 'Leo', score: 88, cohort: 'data' }
    ]
  },
  {
    name: 'enrollments',
    description: 'Which courses each student is in',
    columns: ['studentId', 'course', 'status'],
    rows: [
      { studentId: 1, course: 'SQL Basics', status: 'active' },
      { studentId: 2, course: 'SQL Basics', status: 'active' },
      { studentId: 3, course: 'Advanced SQL', status: 'paused' },
      { studentId: 4, course: 'SQL Basics', status: 'active' }
    ]
  },
  {
    name: 'courses',
    description: 'Course catalog for the training app',
    columns: ['id', 'title', 'level'],
    rows: [
      { id: 1, title: 'SQL Basics', level: 'beginner' },
      { id: 2, title: 'Advanced SQL', level: 'advanced' }
    ]
  }
]

demoTables.push(...getStoredDatasets())

function createDemoDatabase() {
  const db = new alasql.Database()
  for (const table of demoTables) {
    db.exec(`CREATE TABLE ${table.name}`)
    db.tables[table.name].data = table.rows.map(row => ({ ...row }))
  }
  return db
}

function runQuery(sql) {
  const trimmed = String(sql || '').trim()
  if (!trimmed) {
    return { rows: [], columns: [], message: 'Query is empty.' }
  }

  const normalized = trimmed.replace(/;\s*$/, '')
  const db = createDemoDatabase()

  try {
    const result = db.exec(normalized)

    if (!Array.isArray(result)) {
      return { rows: [], columns: [], message: 'Query executed successfully.' }
    }

    if (!result.length) {
      return { rows: [], columns: [], message: 'Query executed successfully.' }
    }

    const columns = Object.keys(result[0] || {})
    return {
      rows: result,
      columns,
      message: `Returned ${result.length} row(s).`
    }
  } catch (error) {
    return { rows: [], columns: [], error: error.message }
  }
}

function getDemoTables() {
  return demoTables
}

module.exports = { runQuery, getDemoTables }
