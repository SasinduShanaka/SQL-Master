const alasql = require('alasql')

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

function createDemoDatabase() {
  const db = new alasql.Database('sql-master-demo')
  db.exec(`
    CREATE TABLE students (id INT, name STRING, score INT, cohort STRING);
    INSERT INTO students VALUES (1, 'Ava', 94, 'web'), (2, 'Noah', 82, 'data'), (3, 'Mia', 76, 'web'), (4, 'Leo', 88, 'data');

    CREATE TABLE enrollments (studentId INT, course STRING, status STRING);
    INSERT INTO enrollments VALUES (1, 'SQL Basics', 'active'), (2, 'SQL Basics', 'active'), (3, 'Advanced SQL', 'paused'), (4, 'SQL Basics', 'active');
  `)
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
